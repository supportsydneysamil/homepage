const { readFileSync } = require('node:fs');
const path = require('node:path');
const { sql, getPool, ensureSchema } = require('../shared/db');

const readJson = (relativePath) =>
  JSON.parse(readFileSync(path.join(__dirname, '..', '..', 'app', 'src', 'content', relativePath), 'utf8'));

const seed = async () => {
  await ensureSchema();
  const pool = await getPool();

  for (const event of readJson('events.json')) {
    await pool
      .request()
      .input('slug', sql.NVarChar(120), event.slug)
      .input('eventDate', sql.Date, event.date)
      .input('title', sql.NVarChar(200), event.title)
      .input('description', sql.NVarChar(sql.MAX), event.description || null)
      .input('youTubeUrl', sql.NVarChar(500), event.youtubeUrl || null)
      .input('actor', sql.NVarChar(256), 'seed')
      .query(`
IF NOT EXISTS (SELECT 1 FROM dbo.Events WHERE Slug = @slug)
INSERT INTO dbo.Events (Slug, EventDate, Title, Description, YouTubeUrl, CreatedBy, UpdatedBy)
VALUES (@slug, @eventDate, @title, @description, @youTubeUrl, @actor, @actor);
`);
    console.log(`event: ${event.slug}`);
  }

  for (const sermon of readJson('sermons.json')) {
    await pool
      .request()
      .input('sermonDate', sql.Date, sermon.date)
      .input('title', sql.NVarChar(200), sermon.title)
      .input('speaker', sql.NVarChar(120), sermon.speaker || null)
      .input('youTubeUrl', sql.NVarChar(500), sermon.youtubeUrl || null)
      .input('actor', sql.NVarChar(256), 'seed')
      .query(`
IF NOT EXISTS (SELECT 1 FROM dbo.Sermons WHERE SermonDate = @sermonDate AND Title = @title)
INSERT INTO dbo.Sermons (SermonDate, Title, Speaker, YouTubeUrl, CreatedBy, UpdatedBy)
VALUES (@sermonDate, @title, @speaker, @youTubeUrl, @actor, @actor);
`);
    console.log(`sermon: ${sermon.title}`);
  }

  await pool.close();
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
