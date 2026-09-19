const { sql, getPool, ensureSchema } = require('../shared/db');
const { requireRole, actorOf, ROLES } = require('../shared/principal');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const YOUTUBE_HOSTS = ['www.youtube.com', 'youtube.com', 'youtu.be'];

const isYouTubeUrl = (value) => {
  try {
    return YOUTUBE_HOSTS.includes(new URL(value).hostname);
  } catch (error) {
    return false;
  }
};

const validateSermonInput = (body) => {
  const input = body || {};
  const date = String(input.date || '').trim();
  const title = String(input.title || '').trim();
  const speaker = String(input.speaker || '').trim();
  const youtubeUrl = String(input.youtubeUrl || '').trim();

  if (!DATE_PATTERN.test(date) || Number.isNaN(Date.parse(date))) return { error: 'Date must be YYYY-MM-DD.' };
  if (!title || title.length > 200) return { error: 'Title is required and must be 200 characters or fewer.' };
  if (youtubeUrl && !isYouTubeUrl(youtubeUrl)) return { error: 'Video URL must be a YouTube link.' };

  return { value: { date, title, speaker: speaker || null, youtubeUrl: youtubeUrl || null } };
};

const mapRow = (row) => ({
  id: row.Id,
  date: row.SermonDate instanceof Date ? row.SermonDate.toISOString().slice(0, 10) : row.SermonDate,
  title: row.Title,
  speaker: row.Speaker || '',
  youtubeUrl: row.YouTubeUrl || '',
});

const listSermons = async () => {
  await ensureSchema();
  const pool = await getPool();
  const result = await pool
    .request()
    .query(
      'SELECT Id, SermonDate, Title, Speaker, YouTubeUrl FROM dbo.Sermons WHERE IsPublished = 1 ORDER BY SermonDate DESC'
    );
  return (result.recordset || []).map(mapRow);
};

module.exports = async function (context, req) {
  try {
    if (req.method === 'GET') {
      context.res = { status: 200, body: { sermons: await listSermons() } };
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
      const parsed = validateSermonInput(req.body);
      if (parsed.error) {
        context.res = { status: 400, body: { error: parsed.error } };
        return;
      }
      const inserted = await pool
        .request()
        .input('sermonDate', sql.Date, parsed.value.date)
        .input('title', sql.NVarChar(200), parsed.value.title)
        .input('speaker', sql.NVarChar(120), parsed.value.speaker)
        .input('youTubeUrl', sql.NVarChar(500), parsed.value.youtubeUrl)
        .input('actor', sql.NVarChar(256), actor)
        .query(`
INSERT INTO dbo.Sermons (SermonDate, Title, Speaker, YouTubeUrl, CreatedBy, UpdatedBy)
OUTPUT inserted.Id, inserted.SermonDate, inserted.Title, inserted.Speaker, inserted.YouTubeUrl
VALUES (@sermonDate, @title, @speaker, @youTubeUrl, @actor, @actor);
`);
      context.res = { status: 201, body: { sermon: mapRow(inserted.recordset[0]) } };
      return;
    }

    if (req.method === 'PUT') {
      const id = String((req.body && req.body.id) || '').trim();
      if (!id) {
        context.res = { status: 400, body: { error: 'Sermon id is required.' } };
        return;
      }
      const parsed = validateSermonInput(req.body);
      if (parsed.error) {
        context.res = { status: 400, body: { error: parsed.error } };
        return;
      }
      const updated = await pool
        .request()
        .input('id', sql.UniqueIdentifier, id)
        .input('sermonDate', sql.Date, parsed.value.date)
        .input('title', sql.NVarChar(200), parsed.value.title)
        .input('speaker', sql.NVarChar(120), parsed.value.speaker)
        .input('youTubeUrl', sql.NVarChar(500), parsed.value.youtubeUrl)
        .input('actor', sql.NVarChar(256), actor)
        .query(`
UPDATE dbo.Sermons
SET SermonDate = @sermonDate, Title = @title, Speaker = @speaker, YouTubeUrl = @youTubeUrl,
    UpdatedBy = @actor, UpdatedAt = SYSUTCDATETIME()
OUTPUT inserted.Id, inserted.SermonDate, inserted.Title, inserted.Speaker, inserted.YouTubeUrl
WHERE Id = @id;
`);
      if (!updated.recordset.length) {
        context.res = { status: 404, body: { error: 'Sermon not found.' } };
        return;
      }
      context.res = { status: 200, body: { sermon: mapRow(updated.recordset[0]) } };
      return;
    }

    if (req.method === 'DELETE') {
      const id = String((req.query && req.query.id) || '').trim();
      if (!id) {
        context.res = { status: 400, body: { error: 'Sermon id is required.' } };
        return;
      }
      await pool.request().input('id', sql.UniqueIdentifier, id).query('DELETE FROM dbo.Sermons WHERE Id = @id');
      context.res = { status: 204 };
      return;
    }

    context.res = { status: 405, body: { error: 'Method not allowed.' } };
  } catch (error) {
    context.log.error('sermons error:', (error && error.message) || error);
    context.res = {
      status: 500,
      body: { error: 'Unable to process sermons.', detail: String((error && error.message) || error).slice(0, 220) },
    };
  }
};

module.exports.validateSermonInput = validateSermonInput;
