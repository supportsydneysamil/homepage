const { sql, getPool, ensureSchema, withSchema } = require('../shared/db');
const { requireRole, actorOf, getClientPrincipal, ROLES } = require('../shared/principal');
const { deleteBlob, MOKJANG_FOLDER } = require('../shared/blob');
const { guardPublicSection } = require('../shared/sectionAvailability');

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const AUDIENCES = ['family', 'young', 'senior', 'all'];
const LANGUAGES = ['ko', 'en', 'both'];
const DOWNLOAD_PREFIX = '/api/files/download/';
// 2627 is a unique constraint violation, 2601 a unique index violation.
const DUPLICATE_KEY_NUMBERS = [2627, 2601];

const OPTIONAL_TEXT = [
  ['nameEn', 60, 'English name', '영어 이름'],
  ['taglineKo', 120, 'Korean introduction', '한 줄 소개(한국어)'],
  ['taglineEn', 120, 'English introduction', '한 줄 소개(영어)'],
  ['missionKo', 120, 'Korean mission field', '후원 선교지(한국어)'],
  ['missionEn', 120, 'English mission field', '후원 선교지(영어)'],
  ['storyKo', 2000, 'Korean story', '목장 이야기(한국어)'],
  ['storyEn', 2000, 'English story', '목장 이야기(영어)'],
  ['shepherdName', 60, 'Shepherd name', '목자 이름'],
  ['partnerName', 60, 'Partner name', '목녀·목부 이름'],
];

const text = (value) => String(value ?? '').trim();
const fail = (error, errorKo) => ({ error, errorKo });

const slugFromName = (name) =>
  text(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const parsePublished = (value) =>
  !(value === false || value === 0 || value === '0' || value === 'false' || value === 'draft');

const parseImageBlobPaths = (value) => {
  const paths = (Array.isArray(value) ? value : []).map(text).filter(Boolean);
  const outside = paths.some((blobPath) => !blobPath.startsWith(`${MOKJANG_FOLDER}/`) || blobPath.includes('..'));
  return outside ? null : paths;
};

const validateMokjangInput = (body) => {
  const input = body || {};
  const nameKo = text(input.nameKo);
  if (!nameKo || nameKo.length > 60) {
    return fail('Korean name is required and must be 60 characters or fewer.', '목장 이름(한국어)을 60자 이내로 입력해 주세요.');
  }

  const optional = {};
  for (const [key, max, label, labelKo] of OPTIONAL_TEXT) {
    const value = text(input[key]);
    if (value.length > max) {
      return fail(`${label} must be ${max} characters or fewer.`, `${labelKo} 칸은 ${max}자 이내로 입력해 주세요.`);
    }
    optional[key] = value || null;
  }

  const slug = text(input.slug).toLowerCase() || slugFromName(input.nameEn);
  if (!slug) {
    return fail('Enter an address name in lowercase English letters.', '주소 이름을 영어 소문자로 입력해 주세요.');
  }
  if (slug.length > 80 || !SLUG_PATTERN.test(slug)) {
    return fail(
      'Address name must be lowercase letters, numbers, and hyphens.',
      '주소 이름은 영어 소문자, 숫자, 하이픈만 쓸 수 있습니다.'
    );
  }

  const suburb = text(input.suburb);
  if (!suburb || suburb.length > 60) {
    return fail('Suburb is required and must be 60 characters or fewer.', '지역을 60자 이내로 입력해 주세요.');
  }

  const meetingDay = text(input.meetingDay).toLowerCase();
  if (!DAYS.includes(meetingDay)) return fail('Choose a meeting day.', '모임 요일을 골라 주세요.');

  const meetingTime = text(input.meetingTime);
  if (!TIME_PATTERN.test(meetingTime)) {
    return fail('Meeting time must be HH:MM.', '모임 시간을 19:30 형식으로 입력해 주세요.');
  }

  const audience = text(input.audience).toLowerCase() || 'all';
  if (!AUDIENCES.includes(audience)) return fail('Choose who the house church is for.', '대상을 골라 주세요.');

  const language = text(input.language).toLowerCase() || 'ko';
  if (!LANGUAGES.includes(language)) return fail('Choose a meeting language.', '모임 언어를 골라 주세요.');

  const imageBlobPaths = parseImageBlobPaths(input.imageBlobPaths);
  if (!imageBlobPaths) {
    return fail('Photos must be uploaded files inside the mokjang folder.', '사진은 목장 폴더에 올린 파일이어야 합니다.');
  }

  const coverImageId = text(input.coverImageId);
  if (coverImageId && !GUID_PATTERN.test(coverImageId)) {
    return fail('Cover photo id is not valid.', '대표 사진 정보가 올바르지 않습니다.');
  }

  return {
    value: {
      slug,
      nameKo,
      ...optional,
      suburb,
      meetingDay,
      meetingTime,
      audience,
      language,
      kidsWelcome: input.kidsWelcome === true || input.kidsWelcome === 'true',
      published: parsePublished(input.published),
      imageBlobPaths,
      coverImageId: coverImageId || null,
    },
  };
};

const canSeeMembers = (principal) => Boolean(principal && principal.userRoles.includes(ROLES.MEMBER));

const mapMokjang = (row, { images = [], includeMembers = false } = {}) => {
  const mokjang = {
    id: row.Id,
    slug: row.Slug,
    nameKo: row.NameKo,
    nameEn: row.NameEn || '',
    taglineKo: row.TaglineKo || '',
    taglineEn: row.TaglineEn || '',
    suburb: row.Suburb,
    meetingDay: row.MeetingDay,
    meetingTime: String(row.MeetingTime || '').trim(),
    audience: row.Audience,
    language: row.MeetingLanguage,
    kidsWelcome: Boolean(row.KidsWelcome),
    missionKo: row.MissionKo || '',
    missionEn: row.MissionEn || '',
    storyKo: row.StoryKo || '',
    storyEn: row.StoryEn || '',
    published: Boolean(row.IsPublished),
    coverImage: row.CoverImageId ? `${DOWNLOAD_PREFIX}${row.CoverImageId}` : images[0] || '',
    images,
  };
  if (includeMembers) {
    mokjang.shepherdName = row.ShepherdName || '';
    mokjang.partnerName = row.PartnerName || '';
  }
  return mokjang;
};

const isMokjangVisible = (row, includeDrafts) => includeDrafts || Boolean(row && row.IsPublished);

const lookupFromQuery = (query) => {
  const id = text(query && query.id);
  const slug = text(query && query.slug);
  if (id) return { id };
  if (slug) return { slug };
  return null;
};

const isDuplicateKeyError = (error) => {
  if (!error) return false;
  const number = error.number ?? (error.originalError && error.originalError.info && error.originalError.info.number);
  return DUPLICATE_KEY_NUMBERS.includes(number);
};

const duplicateResponse = () => ({
  status: 409,
  body: { error: 'A house church with this address name already exists.', errorKo: '같은 주소 이름의 목장이 이미 있습니다.' },
});

const MOKJANG_COLUMNS =
  'm.Id, m.Slug, m.NameKo, m.NameEn, m.TaglineKo, m.TaglineEn, m.Suburb, m.MeetingDay, m.MeetingTime, m.Audience, m.MeetingLanguage, m.KidsWelcome, m.MissionKo, m.MissionEn, m.StoryKo, m.StoryEn, m.ShepherdName, m.PartnerName, m.IsPublished';

const listMokjangRows = async (includeDrafts) =>
  withSchema(async () => {
    const pool = await getPool();
    const result = await pool.request().query(`
SELECT ${MOKJANG_COLUMNS}, cover.Id AS CoverImageId
FROM dbo.Mokjangs m
OUTER APPLY (
  SELECT TOP 1 i.Id FROM dbo.MokjangImages i WHERE i.MokjangId = m.Id ORDER BY i.SortOrder, i.CreatedAt
) cover
${includeDrafts ? '' : 'WHERE m.IsPublished = 1'}
ORDER BY m.NameKo;
`);
    return result.recordset || [];
  });

const loadImageUrls = async (pool, mokjangId) => {
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, mokjangId)
    .query('SELECT Id FROM dbo.MokjangImages WHERE MokjangId = @id ORDER BY SortOrder, CreatedAt');
  return (result.recordset || []).map((image) => `${DOWNLOAD_PREFIX}${image.Id}`);
};

const getReadableMokjang = async (lookup, includeDrafts, includeMembers) =>
  withSchema(async () => {
    const pool = await getPool();
    const request = pool.request();
    if (lookup.id) request.input('id', sql.UniqueIdentifier, lookup.id);
    else request.input('slug', sql.NVarChar(80), lookup.slug);
    const result = await request.query(
      `SELECT ${MOKJANG_COLUMNS} FROM dbo.Mokjangs m WHERE ${lookup.id ? 'm.Id = @id' : 'm.Slug = @slug'}`
    );
    const row = result.recordset && result.recordset[0];
    if (!row || !isMokjangVisible(row, includeDrafts)) return null;
    return mapMokjang(row, { images: await loadImageUrls(pool, row.Id), includeMembers });
  });

const bindMokjang = (request, value, actor) =>
  request
    .input('slug', sql.NVarChar(80), value.slug)
    .input('nameKo', sql.NVarChar(60), value.nameKo)
    .input('nameEn', sql.NVarChar(60), value.nameEn)
    .input('taglineKo', sql.NVarChar(120), value.taglineKo)
    .input('taglineEn', sql.NVarChar(120), value.taglineEn)
    .input('suburb', sql.NVarChar(60), value.suburb)
    .input('meetingDay', sql.NVarChar(3), value.meetingDay)
    .input('meetingTime', sql.NVarChar(5), value.meetingTime)
    .input('audience', sql.NVarChar(10), value.audience)
    .input('language', sql.NVarChar(4), value.language)
    .input('kidsWelcome', sql.Bit, value.kidsWelcome)
    .input('missionKo', sql.NVarChar(120), value.missionKo)
    .input('missionEn', sql.NVarChar(120), value.missionEn)
    .input('storyKo', sql.NVarChar(2000), value.storyKo)
    .input('storyEn', sql.NVarChar(2000), value.storyEn)
    .input('shepherdName', sql.NVarChar(60), value.shepherdName)
    .input('partnerName', sql.NVarChar(60), value.partnerName)
    .input('published', sql.Bit, value.published)
    .input('actor', sql.NVarChar(256), actor);

const INSERT_SQL = `
INSERT INTO dbo.Mokjangs
  (Slug, NameKo, NameEn, TaglineKo, TaglineEn, Suburb, MeetingDay, MeetingTime, Audience, MeetingLanguage, KidsWelcome,
   MissionKo, MissionEn, StoryKo, StoryEn, ShepherdName, PartnerName, IsPublished, CreatedBy, UpdatedBy)
OUTPUT inserted.Id
VALUES
  (@slug, @nameKo, @nameEn, @taglineKo, @taglineEn, @suburb, @meetingDay, @meetingTime, @audience, @language, @kidsWelcome,
   @missionKo, @missionEn, @storyKo, @storyEn, @shepherdName, @partnerName, @published, @actor, @actor);
`;

const UPDATE_SQL = `
UPDATE dbo.Mokjangs
SET Slug = @slug, NameKo = @nameKo, NameEn = @nameEn, TaglineKo = @taglineKo, TaglineEn = @taglineEn,
    Suburb = @suburb, MeetingDay = @meetingDay, MeetingTime = @meetingTime, Audience = @audience,
    MeetingLanguage = @language, KidsWelcome = @kidsWelcome, MissionKo = @missionKo, MissionEn = @missionEn,
    StoryKo = @storyKo, StoryEn = @storyEn, ShepherdName = @shepherdName, PartnerName = @partnerName,
    IsPublished = @published, UpdatedBy = @actor, UpdatedAt = SYSUTCDATETIME()
WHERE Id = @id;
SELECT @@ROWCOUNT AS Affected;
`;

const addImages = async (pool, mokjangId, blobPaths, actor) => {
  for (const blobPath of blobPaths) {
    await pool
      .request()
      .input('mokjangId', sql.UniqueIdentifier, mokjangId)
      .input('blobPath', sql.NVarChar(400), blobPath)
      .input('actor', sql.NVarChar(256), actor)
      .query(`
INSERT INTO dbo.MokjangImages (MokjangId, BlobPath, SortOrder, CreatedBy, UpdatedBy)
VALUES (
  @mokjangId,
  @blobPath,
  (SELECT ISNULL(MAX(SortOrder), -1) + 1 FROM dbo.MokjangImages WHERE MokjangId = @mokjangId),
  @actor,
  @actor
);
`);
  }
};

const SET_COVER_SQL = `
UPDATE dbo.MokjangImages
SET SortOrder = (SELECT MIN(SortOrder) - 1 FROM dbo.MokjangImages WHERE MokjangId = @mokjangId),
    UpdatedBy = @actor, UpdatedAt = SYSUTCDATETIME()
WHERE Id = @coverId AND MokjangId = @mokjangId;
`;

const setCover = (pool, mokjangId, coverId, actor) =>
  pool
    .request()
    .input('mokjangId', sql.UniqueIdentifier, mokjangId)
    .input('coverId', sql.UniqueIdentifier, coverId)
    .input('actor', sql.NVarChar(256), actor)
    .query(SET_COVER_SQL);

const defaultDeps = { guardPublicSection, listMokjangRows, getReadableMokjang };

module.exports = async function (context, req, overrides = {}) {
  const deps = { ...defaultDeps, ...overrides };
  try {
    // Replies differ by who is signed in, so no shared cache may keep them.
    if (req.method === 'GET') {
      const unavailable = await deps.guardPublicSection(req, 'mokjang', {
        logger: context.log,
      });
      if (unavailable) {
        context.res = unavailable;
        return;
      }
      const principal = getClientPrincipal(req);
      const includeDrafts = Boolean(principal && principal.userRoles.includes(ROLES.EDITOR));
      const includeMembers = canSeeMembers(principal);
      const lookup = lookupFromQuery(req.query);
      if (lookup) {
        const mokjang = await deps.getReadableMokjang(lookup, includeDrafts, includeMembers);
        context.res = {
          status: 200,
          headers: { 'Cache-Control': 'private, no-store' },
          body: { mokjangs: mokjang ? [mokjang] : [] },
        };
        return;
      }
      const rows = await deps.listMokjangRows(includeDrafts);
      context.res = {
        status: 200,
        headers: { 'Cache-Control': 'private, no-store' },
        body: { mokjangs: rows.map((row) => mapMokjang(row, { includeMembers })) },
      };
      return;
    }

    const auth = requireRole(req, ROLES.EDITOR);
    if (auth.error) {
      context.res = { status: auth.error.status, body: auth.error.body };
      return;
    }
    const actor = actorOf(auth.principal);
    await ensureSchema();
    const pool = await getPool();

    if (req.method === 'POST' || req.method === 'PUT') {
      const parsed = validateMokjangInput(req.body);
      if (parsed.error) {
        context.res = { status: 400, body: { error: parsed.error, errorKo: parsed.errorKo } };
        return;
      }

      let id = text(req.body && req.body.id);
      if (req.method === 'PUT' && !id) {
        context.res = { status: 400, body: { error: 'Mokjang id is required.', errorKo: '목장 id가 필요합니다.' } };
        return;
      }

      try {
        if (req.method === 'POST') {
          const inserted = await bindMokjang(pool.request(), parsed.value, actor).query(INSERT_SQL);
          id = inserted.recordset[0].Id;
        } else {
          const updated = await bindMokjang(pool.request(), parsed.value, actor)
            .input('id', sql.UniqueIdentifier, id)
            .query(UPDATE_SQL);
          if (!updated.recordset[0].Affected) {
            context.res = { status: 404, body: { error: 'Mokjang not found.', errorKo: '목장을 찾을 수 없습니다.' } };
            return;
          }
        }
      } catch (error) {
        if (!isDuplicateKeyError(error)) throw error;
        context.res = duplicateResponse();
        return;
      }

      await addImages(pool, id, parsed.value.imageBlobPaths, actor);
      if (parsed.value.coverImageId) await setCover(pool, id, parsed.value.coverImageId, actor);
      context.res = {
        status: req.method === 'POST' ? 201 : 200,
        body: { mokjang: await getReadableMokjang({ id }, true, canSeeMembers(auth.principal)) },
      };
      return;
    }

    if (req.method === 'DELETE') {
      const id = text(req.query && req.query.id);
      if (!id) {
        context.res = { status: 400, body: { error: 'Mokjang id is required.', errorKo: '목장 id가 필요합니다.' } };
        return;
      }
      const photos = await pool
        .request()
        .input('id', sql.UniqueIdentifier, id)
        .query('SELECT BlobPath FROM dbo.MokjangImages WHERE MokjangId = @id');
      await pool.request().input('id', sql.UniqueIdentifier, id).query('DELETE FROM dbo.Mokjangs WHERE Id = @id');
      for (const photo of photos.recordset || []) {
        try {
          await deleteBlob(photo.BlobPath, MOKJANG_FOLDER);
        } catch (error) {
          context.log.error('mokjang photo delete error:', (error && error.message) || error);
        }
      }
      context.res = { status: 204 };
      return;
    }

    context.res = { status: 405, body: { error: 'Method not allowed.' } };
  } catch (error) {
    context.log.error('mokjang error:', (error && error.message) || error);
    context.res = {
      status: 500,
      body: { error: 'Unable to process house churches.', detail: String((error && error.message) || error).slice(0, 220) },
    };
  }
};

module.exports.validateMokjangInput = validateMokjangInput;
module.exports.mapMokjang = mapMokjang;
module.exports.canSeeMembers = canSeeMembers;
module.exports.isMokjangVisible = isMokjangVisible;
module.exports.lookupFromQuery = lookupFromQuery;
module.exports.isDuplicateKeyError = isDuplicateKeyError;
module.exports.SET_COVER_SQL = SET_COVER_SQL;
