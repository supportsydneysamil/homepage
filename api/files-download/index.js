const { sql, getPool, ensureSchema } = require('../shared/db');
const { requireRole, ROLES } = require('../shared/principal');
const { createReadSas } = require('../shared/blob');

// Resolving the id through SQL keeps callers from naming an arbitrary blob.
const lookupBlobPath = async (id) => {
  await ensureSchema();
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, id)
    .query(`
SELECT BlobPath FROM dbo.Resources WHERE Id = @id
UNION ALL
SELECT BlobPath FROM dbo.SermonFiles WHERE Id = @id
UNION ALL
SELECT BlobPath FROM dbo.EventImages WHERE Id = @id;
`);
  const row = result.recordset && result.recordset[0];
  return row ? row.BlobPath : null;
};

module.exports = async function (context, req) {
  const auth = requireRole(req, ROLES.MEMBER);
  if (auth.error) {
    context.res = { status: auth.error.status, body: auth.error.body };
    return;
  }

  const id = String((req.params && req.params.id) || '').trim();
  if (!id) {
    context.res = { status: 400, body: { error: 'File id is required.' } };
    return;
  }

  try {
    const blobPath = await lookupBlobPath(id);
    if (!blobPath) {
      context.res = { status: 404, body: { error: 'File not found.' } };
      return;
    }
    context.res = {
      status: 302,
      headers: { Location: await createReadSas(blobPath), 'Cache-Control': 'no-store' },
    };
  } catch (error) {
    context.log.error('files-download error:', (error && error.message) || error);
    context.res = { status: 500, body: { error: 'Unable to prepare the download.' } };
  }
};
