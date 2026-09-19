const { sql, getPool, ensureSchema } = require('../shared/db');
const { requireRole, actorOf, ROLES } = require('../shared/principal');
const { deleteBlob } = require('../shared/blob');

const validateResourceInput = (body) => {
  const input = body || {};
  const title = String(input.title || '').trim();
  const blobPath = String(input.blobPath || '').trim();
  const contentType = String(input.contentType || '').trim();
  const sizeBytes = Number(input.sizeBytes);

  if (!title || title.length > 200) return { error: 'Title is required and must be 200 characters or fewer.' };
  if (!blobPath.startsWith('resources/') || blobPath.includes('..')) {
    return { error: 'Blob path must be an uploaded file inside the resources folder.' };
  }
  if (!contentType) return { error: 'Content type is required.' };
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return { error: 'Size must be a positive number.' };

  return { value: { title, blobPath, contentType, sizeBytes } };
};

const toResourceResponse = (row) => ({
  id: row.Id,
  title: row.Title,
  contentType: row.ContentType || '',
  sizeBytes: row.SizeBytes || 0,
  downloadUrl: `/api/files/download/${row.Id}`,
});

module.exports = async function (context, req) {
  try {
    await ensureSchema();
    const pool = await getPool();

    if (req.method === 'GET') {
      const auth = requireRole(req, ROLES.MEMBER);
      if (auth.error) {
        context.res = { status: auth.error.status, body: auth.error.body };
        return;
      }
      const result = await pool
        .request()
        .query('SELECT Id, Title, ContentType, SizeBytes FROM dbo.Resources ORDER BY CreatedAt DESC');
      context.res = { status: 200, body: { resources: (result.recordset || []).map(toResourceResponse) } };
      return;
    }

    const auth = requireRole(req, ROLES.EDITOR);
    if (auth.error) {
      context.res = { status: auth.error.status, body: auth.error.body };
      return;
    }
    const actor = actorOf(auth.principal);

    if (req.method === 'POST') {
      const parsed = validateResourceInput(req.body);
      if (parsed.error) {
        context.res = { status: 400, body: { error: parsed.error } };
        return;
      }
      const inserted = await pool
        .request()
        .input('title', sql.NVarChar(200), parsed.value.title)
        .input('blobPath', sql.NVarChar(400), parsed.value.blobPath)
        .input('contentType', sql.NVarChar(150), parsed.value.contentType)
        .input('sizeBytes', sql.BigInt, parsed.value.sizeBytes)
        .input('actor', sql.NVarChar(256), actor)
        .query(`
INSERT INTO dbo.Resources (Title, BlobPath, ContentType, SizeBytes, CreatedBy, UpdatedBy)
OUTPUT inserted.Id, inserted.Title, inserted.ContentType, inserted.SizeBytes
VALUES (@title, @blobPath, @contentType, @sizeBytes, @actor, @actor);
`);
      context.res = { status: 201, body: { resource: toResourceResponse(inserted.recordset[0]) } };
      return;
    }

    if (req.method === 'DELETE') {
      const id = String((req.query && req.query.id) || '').trim();
      if (!id) {
        context.res = { status: 400, body: { error: 'Resource id is required.' } };
        return;
      }
      const deleted = await pool
        .request()
        .input('id', sql.UniqueIdentifier, id)
        .query('DELETE FROM dbo.Resources OUTPUT deleted.BlobPath WHERE Id = @id');
      const row = deleted.recordset && deleted.recordset[0];
      if (row) {
        await deleteBlob(row.BlobPath);
      }
      context.res = { status: 204 };
      return;
    }

    context.res = { status: 405, body: { error: 'Method not allowed.' } };
  } catch (error) {
    context.log.error('resources error:', (error && error.message) || error);
    context.res = {
      status: 500,
      body: { error: 'Unable to process resources.', detail: String((error && error.message) || error).slice(0, 220) },
    };
  }
};

module.exports.validateResourceInput = validateResourceInput;
module.exports.toResourceResponse = toResourceResponse;
