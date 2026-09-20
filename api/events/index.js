const { sql, getPool, ensureSchema, withSchema } = require('../shared/db');
const { requireRole, actorOf, getClientPrincipal, ROLES } = require('../shared/principal');

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const YOUTUBE_HOSTS = ['www.youtube.com', 'youtube.com', 'youtu.be'];

const isYouTubeUrl = (value) => {
  try {
    return YOUTUBE_HOSTS.includes(new URL(value).hostname);
  } catch (error) {
    return false;
  }
};

const slugFromTitle = (title, date) => {
  const fromTitle = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (fromTitle) return fromTitle;
  return DATE_PATTERN.test(date) ? `event-${date}` : '';
};

const parsePublished = (value) => {
  if (value === false || value === 0 || value === '0' || value === 'false' || value === 'draft') return false;
  return true;
};

const parseImageBlobPaths = (value) => {
  const raw = Array.isArray(value) ? value : [];
  const imageBlobPaths = raw.map((item) => String(item || '').trim()).filter(Boolean);
  for (const blobPath of imageBlobPaths) {
    if (!blobPath.startsWith('events/') || blobPath.includes('..')) {
      return { error: 'Image path must be an uploaded file inside the events folder.' };
    }
  }
  return { imageBlobPaths };
};

const validateEventInput = (body) => {
  const input = body || {};
  const date = String(input.date || '').trim();
  const title = String(input.title || '').trim();
  const slug = String(input.slug || '').trim().toLowerCase() || slugFromTitle(title, date);
  const description = String(input.description || '').trim();
  const location = String(input.location || '').trim();
  const startTime = String(input.startTime || '').trim();
  const youtubeUrl = String(input.youtubeUrl || '').trim();

  if (slug === 'detail') return { error: 'Slug cannot be "detail".' };
  if (!SLUG_PATTERN.test(slug)) return { error: 'Slug must be lowercase words separated by hyphens.' };
  if (!DATE_PATTERN.test(date) || Number.isNaN(Date.parse(date))) return { error: 'Date must be YYYY-MM-DD.' };
  if (!title || title.length > 200) return { error: 'Title is required and must be 200 characters or fewer.' };
  if (location.length > 200) return { error: 'Location must be 200 characters or fewer.' };
  if (startTime && !TIME_PATTERN.test(startTime)) return { error: 'Start time must be HH:MM.' };
  if (youtubeUrl && !isYouTubeUrl(youtubeUrl)) return { error: 'Video URL must be a YouTube link.' };

  const images = parseImageBlobPaths(input.imageBlobPaths);
  if (images.error) return { error: images.error };

  return {
    value: {
      slug,
      date,
      title,
      description: description || null,
      location: location || null,
      startTime: startTime || null,
      youtubeUrl: youtubeUrl || null,
      published: parsePublished(input.published),
      imageBlobPaths: images.imageBlobPaths,
    },
  };
};

const mapRow = (row) => ({
  id: row.Id,
  slug: row.Slug,
  date: row.EventDate instanceof Date ? row.EventDate.toISOString().slice(0, 10) : row.EventDate,
  title: row.Title,
  description: row.Description || '',
  location: row.Location || '',
  startTime: String(row.StartTime || '').trim(),
  youtubeUrl: row.YouTubeUrl || '',
  published: Boolean(row.IsPublished),
  images: Array.isArray(row.images) ? row.images : [],
});

const lookupFromQuery = (query) => {
  const id = String((query && query.id) || '').trim();
  const slug = String((query && query.slug) || '').trim();
  if (id) return { id };
  if (slug) return { slug };
  return null;
};

const isEventVisible = (row, includeDrafts) => includeDrafts || Boolean(row && row.IsPublished);

const assembleEvents = (eventRows, imageRows) => {
  const imagesByEvent = new Map();
  for (const image of imageRows || []) {
    const list = imagesByEvent.get(image.EventId) || [];
    list.push(`/api/files/download/${image.Id}`);
    imagesByEvent.set(image.EventId, list);
  }
  return (eventRows || []).map((row) => ({
    ...mapRow(row),
    images: imagesByEvent.get(row.Id) || [],
  }));
};

const EVENT_SELECT =
  'SELECT Id, Slug, EventDate, Title, Description, YouTubeUrl, Location, StartTime, IsPublished FROM dbo.Events';

const loadImages = async (pool, eventIds) => {
  if (!eventIds.length) return [];
  const request = pool.request();
  eventIds.forEach((id, index) => request.input(`id${index}`, sql.UniqueIdentifier, id));
  const result = await request.query(`
SELECT Id, EventId FROM dbo.EventImages
WHERE EventId IN (${eventIds.map((_, index) => `@id${index}`).join(', ')})
ORDER BY SortOrder, CreatedAt
`);
  return result.recordset || [];
};

const listEvents = async (includeDrafts) =>
  withSchema(async () => {
    const pool = await getPool();
    const result = await pool.request().query(
      `${EVENT_SELECT}${includeDrafts ? '' : ' WHERE IsPublished = 1'} ORDER BY EventDate DESC`
    );
    // ponytail: list payload stays small; photos load on the one-event GET
    return assembleEvents(result.recordset || [], []);
  });

const getEventById = async (id) => {
  const pool = await getPool();
  const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`${EVENT_SELECT} WHERE Id = @id`);
  const row = result.recordset && result.recordset[0];
  if (!row) return null;
  const images = await loadImages(pool, [id]);
  return assembleEvents([row], images)[0];
};

const getReadableEvent = async (lookup, includeDrafts) =>
  withSchema(async () => {
    const pool = await getPool();
    const request = pool.request();
    const sqlText = lookup.id
      ? `${EVENT_SELECT} WHERE Id = @id`
      : `${EVENT_SELECT} WHERE Slug = @slug`;
    if (lookup.id) request.input('id', sql.UniqueIdentifier, lookup.id);
    else request.input('slug', sql.NVarChar(120), lookup.slug);
    const result = await request.query(sqlText);
    const row = result.recordset && result.recordset[0];
    if (!row || !isEventVisible(row, includeDrafts)) return null;
    const images = await loadImages(pool, [row.Id]);
    return assembleEvents([row], images)[0];
  });

const addEventImages = async (pool, eventId, blobPaths, actor) => {
  for (const blobPath of blobPaths) {
    await pool
      .request()
      .input('eventId', sql.UniqueIdentifier, eventId)
      .input('blobPath', sql.NVarChar(400), blobPath)
      .input('actor', sql.NVarChar(256), actor)
      .query(`
INSERT INTO dbo.EventImages (EventId, BlobPath, SortOrder, CreatedBy, UpdatedBy)
VALUES (
  @eventId,
  @blobPath,
  (SELECT ISNULL(MAX(SortOrder), -1) + 1 FROM dbo.EventImages WHERE EventId = @eventId),
  @actor,
  @actor
);
`);
  }
};

module.exports = async function (context, req) {
  try {
    if (req.method === 'GET') {
      const principal = getClientPrincipal(req);
      const includeDrafts = Boolean(principal && principal.userRoles.includes(ROLES.EDITOR));
      const lookup = lookupFromQuery(req.query);
      if (lookup) {
        const event = await getReadableEvent(lookup, includeDrafts);
        context.res = { status: 200, body: { events: event ? [event] : [] } };
        return;
      }
      context.res = { status: 200, body: { events: await listEvents(includeDrafts) } };
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

    if (req.method === 'POST') {
      const parsed = validateEventInput(req.body);
      if (parsed.error) {
        context.res = { status: 400, body: { error: parsed.error } };
        return;
      }
      const inserted = await pool
        .request()
        .input('slug', sql.NVarChar(120), parsed.value.slug)
        .input('eventDate', sql.Date, parsed.value.date)
        .input('title', sql.NVarChar(200), parsed.value.title)
        .input('description', sql.NVarChar(sql.MAX), parsed.value.description)
        .input('location', sql.NVarChar(200), parsed.value.location)
        .input('startTime', sql.NVarChar(5), parsed.value.startTime)
        .input('youTubeUrl', sql.NVarChar(500), parsed.value.youtubeUrl)
        .input('published', sql.Bit, parsed.value.published)
        .input('actor', sql.NVarChar(256), actor)
        .query(`
INSERT INTO dbo.Events (Slug, EventDate, Title, Description, Location, StartTime, YouTubeUrl, IsPublished, CreatedBy, UpdatedBy)
OUTPUT inserted.Id
VALUES (@slug, @eventDate, @title, @description, @location, @startTime, @youTubeUrl, @published, @actor, @actor);
`);
      const id = inserted.recordset[0].Id;
      await addEventImages(pool, id, parsed.value.imageBlobPaths, actor);
      context.res = { status: 201, body: { event: await getEventById(id) } };
      return;
    }

    if (req.method === 'PUT') {
      const id = String((req.body && req.body.id) || '').trim();
      if (!id) {
        context.res = { status: 400, body: { error: 'Event id is required.' } };
        return;
      }
      const parsed = validateEventInput(req.body);
      if (parsed.error) {
        context.res = { status: 400, body: { error: parsed.error } };
        return;
      }
      const updated = await pool
        .request()
        .input('id', sql.UniqueIdentifier, id)
        .input('slug', sql.NVarChar(120), parsed.value.slug)
        .input('eventDate', sql.Date, parsed.value.date)
        .input('title', sql.NVarChar(200), parsed.value.title)
        .input('description', sql.NVarChar(sql.MAX), parsed.value.description)
        .input('location', sql.NVarChar(200), parsed.value.location)
        .input('startTime', sql.NVarChar(5), parsed.value.startTime)
        .input('youTubeUrl', sql.NVarChar(500), parsed.value.youtubeUrl)
        .input('published', sql.Bit, parsed.value.published)
        .input('actor', sql.NVarChar(256), actor)
        .query(`
UPDATE dbo.Events
SET Slug = @slug, EventDate = @eventDate, Title = @title, Description = @description,
    Location = @location, StartTime = @startTime, YouTubeUrl = @youTubeUrl, IsPublished = @published,
    UpdatedBy = @actor, UpdatedAt = SYSUTCDATETIME()
WHERE Id = @id;
SELECT @@ROWCOUNT AS Affected;
`);
      if (!updated.recordset[0].Affected) {
        context.res = { status: 404, body: { error: 'Event not found.' } };
        return;
      }
      await addEventImages(pool, id, parsed.value.imageBlobPaths, actor);
      context.res = { status: 200, body: { event: await getEventById(id) } };
      return;
    }

    if (req.method === 'DELETE') {
      const id = String((req.query && req.query.id) || '').trim();
      if (!id) {
        context.res = { status: 400, body: { error: 'Event id is required.' } };
        return;
      }
      await pool.request().input('id', sql.UniqueIdentifier, id).query('DELETE FROM dbo.Events WHERE Id = @id');
      context.res = { status: 204 };
      return;
    }

    context.res = { status: 405, body: { error: 'Method not allowed.' } };
  } catch (error) {
    context.log.error('events error:', (error && error.message) || error);
    context.res = {
      status: 500,
      body: { error: 'Unable to process events.', detail: String((error && error.message) || error).slice(0, 220) },
    };
  }
};

module.exports.validateEventInput = validateEventInput;
module.exports.assembleEvents = assembleEvents;
module.exports.lookupFromQuery = lookupFromQuery;
module.exports.isEventVisible = isEventVisible;
