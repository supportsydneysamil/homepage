const { sql, getPool, withSchema } = require('../shared/db');
const { getClientPrincipal } = require('../shared/principal');
const { canSee, DEFAULT_VISIBILITY } = require('../shared/library');
const { createReadSas, displayFileName, readDisposition } = require('../shared/blob');
const { guardPublicSection } = require('../shared/sectionAvailability');

// Event and house church photos are shown on public pages, so they are public.
// Sermon attachments have no visibility column and stay at the member level.
const FILE_LOOKUP_SQL = `
SELECT BlobPath, Visibility, ContentType, 'resources' AS Section FROM dbo.Resources WHERE Id = @id
UNION ALL
SELECT BlobPath, '${DEFAULT_VISIBILITY}' AS Visibility, CAST(NULL AS nvarchar(150)) AS ContentType, 'sermons' AS Section FROM dbo.SermonFiles WHERE Id = @id
UNION ALL
SELECT BlobPath, 'public' AS Visibility, CAST(NULL AS nvarchar(150)) AS ContentType, 'events' AS Section FROM dbo.EventImages WHERE Id = @id
UNION ALL
SELECT BlobPath, 'public' AS Visibility, CAST(NULL AS nvarchar(150)) AS ContentType, 'mokjang' AS Section FROM dbo.MokjangImages WHERE Id = @id;
`;

const lookupFile = async (id) =>
  withSchema(async () => {
    const pool = await getPool();
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(FILE_LOOKUP_SQL);
    const row = result.recordset && result.recordset[0];
    if (!row) return null;
    const fileName = displayFileName(row.BlobPath);
    return {
      blobPath: row.BlobPath,
      visibility: row.Visibility,
      section: row.Section,
      contentDisposition: row.ContentType && fileName ? readDisposition(fileName, row.ContentType) : undefined,
    };
  });

const defaultDeps = { lookupFile, guardPublicSection, createReadSas };

module.exports = async function (context, req, overrides = {}) {
  const deps = { ...defaultDeps, ...overrides };
  const id = String((req.params && req.params.id) || '').trim();
  if (!id) {
    context.res = { status: 400, body: { error: 'File id is required.' } };
    return;
  }

  try {
    const file = await deps.lookupFile(id);
    if (!file) {
      context.res = { status: 404, body: { error: 'File not found.' } };
      return;
    }

    const unavailable = await deps.guardPublicSection(req, file.section, {
      logger: context.log,
    });
    if (unavailable) {
      context.res = unavailable;
      return;
    }

    const principal = getClientPrincipal(req);
    const userRoles = principal ? principal.userRoles : [];
    if (!canSee(file.visibility, userRoles)) {
      context.res = principal
        ? {
            status: 403,
            body: { error: 'You do not have access to this file.', errorKo: '이 자료에 접근할 권한이 없습니다.' },
          }
        : { status: 401, body: { error: 'Sign-in required.', errorKo: '로그인이 필요합니다.' } };
      return;
    }

    context.res = {
      status: 302,
      headers: {
        Location: await deps.createReadSas(
          file.blobPath,
          file.contentDisposition ? { contentDisposition: file.contentDisposition } : undefined
        ),
        'Cache-Control': 'no-store',
      },
    };
  } catch (error) {
    context.log.error('files-download error:', (error && error.message) || error);
    context.res = { status: 500, body: { error: 'Unable to prepare the download.' } };
  }
};

module.exports.lookupFile = lookupFile;
module.exports.FILE_LOOKUP_SQL = FILE_LOOKUP_SQL;
