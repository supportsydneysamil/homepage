const { sql, getPool, ensureSchema } = require('../shared/db');
const { requireRole, actorOf, ROLES } = require('../shared/principal');

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const YOUTUBE_HOSTS = ['www.youtube.com', 'youtube.com', 'youtu.be'];

const isYouTubeUrl = (value) => {
  try {
    return YOUTUBE_HOSTS.includes(new URL(value).hostname);
  } catch (error) {
    return false;
  }
};

const validateEventInput = (body) => {
  const input = body || {};
  const slug = String(input.slug || '').trim().toLowerCase();
  const date = String(input.date || '').trim();
  const title = String(input.title || '').trim();
  const description = String(input.description || '').trim();
  const youtubeUrl = String(input.youtubeUrl || '').trim();

  if (!SLUG_PATTERN.test(slug)) return { error: 'Slug must be lowercase words separated by hyphens.' };
  if (!DATE_PATTERN.test(date) || Number.isNaN(Date.parse(date))) return { error: 'Date must be YYYY-MM-DD.' };
  if (!title || title.length > 200) return { error: 'Title is required and must be 200 characters or fewer.' };
  if (youtubeUrl && !isYouTubeUrl(youtubeUrl)) return { error: 'Video URL must be a YouTube link.' };

  return {
    value: { slug, date, title, description: description || null, youtubeUrl: youtubeUrl || null },
  };
};

const mapRow = (row) => ({
  id: row.Id,
  slug: row.Slug,
  date: row.EventDate instanceof Date ? row.EventDate.toISOString().slice(0, 10) : row.EventDate,
  title: row.Title,
  description: row.Description || '',
  youtubeUrl: row.YouTubeUrl || '',
  images: [],
});

const listEvents = async () => {
  await ensureSchema();
  const pool = await getPool();
  const result = await pool
    .request()
    .query(
      'SELECT Id, Slug, EventDate, Title, Description, YouTubeUrl FROM dbo.Events WHERE IsPublished = 1 ORDER BY EventDate DESC'
    );
  return (result.recordset || []).map(mapRow);
};

const getEventById = async (id) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, id)
    .query('SELECT Id, Slug, EventDate, Title, Description, YouTubeUrl FROM dbo.Events WHERE Id = @id');
  const row = result.recordset && result.recordset[0];
  return row ? mapRow(row) : null;
};

module.exports = async function (context, req) {
  try {
    if (req.method === 'GET') {
      context.res = { status: 200, body: { events: await listEvents() } };
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
        .input('youTubeUrl', sql.NVarChar(500), parsed.value.youtubeUrl)
        .input('actor', sql.NVarChar(256), actor)
        .query(`
INSERT INTO dbo.Events (Slug, EventDate, Title, Description, YouTubeUrl, CreatedBy, UpdatedBy)
OUTPUT inserted.Id
VALUES (@slug, @eventDate, @title, @description, @youTubeUrl, @actor, @actor);
`);
      const id = inserted.recordset[0].Id;
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
        .input('youTubeUrl', sql.NVarChar(500), parsed.value.youtubeUrl)
        .input('actor', sql.NVarChar(256), actor)
        .query(`
UPDATE dbo.Events
SET Slug = @slug, EventDate = @eventDate, Title = @title, Description = @description,
    YouTubeUrl = @youTubeUrl, UpdatedBy = @actor, UpdatedAt = SYSUTCDATETIME()
WHERE Id = @id;
SELECT @@ROWCOUNT AS Affected;
`);
      if (!updated.recordset[0].Affected) {
        context.res = { status: 404, body: { error: 'Event not found.' } };
        return;
      }
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
