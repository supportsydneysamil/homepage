const { sql, getPool, ensureSchema } = require('../shared/db');
const { requireRole, ROLES } = require('../shared/principal');
const { deleteBlob } = require('../shared/blob');

// Deleting through SQL keeps callers from naming an arbitrary blob: the id has
// to belong to a row in EventImages before its file is removed.
const deleteEventImage = async (id) => {
  await ensureSchema();
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, id)
    .query('DELETE FROM dbo.EventImages OUTPUT deleted.BlobPath WHERE Id = @id');
  const row = result.recordset && result.recordset[0];
  return row ? { blobPath: row.BlobPath } : null;
};

const defaultDeps = { deleteEventImage, deleteBlob };

module.exports = async function (context, req, deps = defaultDeps) {
  try {
    if (req.method !== 'DELETE') {
      context.res = { status: 405, body: { error: 'Method not allowed.' } };
      return;
    }

    const auth = requireRole(req, ROLES.EDITOR);
    if (auth.error) {
      context.res = { status: auth.error.status, body: auth.error.body };
      return;
    }

    const id = String((req.query && req.query.id) || '').trim();
    if (!id) {
      context.res = { status: 400, body: { error: 'Photo id is required.' } };
      return;
    }

    const image = await deps.deleteEventImage(id);
    if (!image) {
      context.res = { status: 404, body: { error: 'Photo not found.' } };
      return;
    }

    await deps.deleteBlob(image.blobPath, 'events');
    context.res = { status: 204 };
  } catch (error) {
    context.log.error('event-images error:', (error && error.message) || error);
    context.res = { status: 500, body: { error: 'Unable to remove the photo.' } };
  }
};

module.exports.deleteEventImage = deleteEventImage;
