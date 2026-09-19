// One-off: register the sermon recordings that were uploaded to the media
// container before the console existed. Safe to re-run; it skips duplicates.
const { sql, getPool, ensureSchema } = require('../shared/db');
const { publicUrlFor } = require('../shared/blob');

const RECORDINGS = [
  { date: '2026-08-09', blob: 'sermon20260809.mp3' },
  { date: '2026-08-16', blob: 'sermon20260816.mp3' },
];

const run = async () => {
  await ensureSchema();
  const pool = await getPool();

  for (const recording of RECORDINGS) {
    const title = `주일예배 (${recording.date})`;
    const mediaUrl = publicUrlFor(recording.blob);

    const result = await pool
      .request()
      .input('sermonDate', sql.Date, recording.date)
      .input('title', sql.NVarChar(200), title)
      .input('mediaUrl', sql.NVarChar(600), mediaUrl)
      .input('mediaContentType', sql.NVarChar(150), 'audio/mpeg')
      .input('actor', sql.NVarChar(256), 'seed')
      .query(`
IF NOT EXISTS (SELECT 1 FROM dbo.Sermons WHERE MediaUrl = @mediaUrl)
INSERT INTO dbo.Sermons (SermonDate, Title, MediaUrl, MediaContentType, CreatedBy, UpdatedBy)
VALUES (@sermonDate, @title, @mediaUrl, @mediaContentType, @actor, @actor);
SELECT @@ROWCOUNT AS Affected;
`);

    const inserted = result.recordset[0].Affected;
    console.log(`${recording.blob}: ${inserted ? 'inserted' : 'already present'} -> ${mediaUrl}`);
  }

  const all = await pool
    .request()
    .query('SELECT SermonDate, Title, MediaContentType FROM dbo.Sermons ORDER BY SermonDate DESC');
  console.log('\nsermons now:');
  for (const row of all.recordset) {
    console.log(` - ${row.SermonDate.toISOString().slice(0, 10)} ${row.Title} [${row.MediaContentType || 'no media'}]`);
  }

  await pool.close();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
