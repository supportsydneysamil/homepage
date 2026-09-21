const { sql, getPool, ensureSchema, withSchema } = require('../shared/db');
const { requireRole, actorOf, getClientPrincipal, ROLES } = require('../shared/principal');
const { deleteBlob, displayFileName } = require('../shared/blob');
const { normalizeCategory, normalizeVisibility, visibleLevelsFor } = require('../shared/library');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseResourceDate = (value) => {
  const date = String(value || '').trim();
  if (!date) return { value: null };
  if (!DATE_PATTERN.test(date) || Number.isNaN(Date.parse(date))) {
    return { error: 'Resource date must be YYYY-MM-DD.' };
  }
  return { value: date };
};

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

  const resourceDate = parseResourceDate(input.resourceDate);
  if (resourceDate.error) return { error: resourceDate.error };

  return {
    value: {
      title,
      blobPath,
      contentType,
      sizeBytes,
      category: normalizeCategory(input.category),
      visibility: normalizeVisibility(input.visibility),
      resourceDate: resourceDate.value,
    },
  };
};

// An update may swap in a freshly uploaded file, but only one that the upload
// endpoint just created inside the resources folder.
const validateResourceUpdate = (body) => {
  const input = body || {};
  const id = String(input.id || '').trim();
  const title = String(input.title || '').trim();
  const blobPath = String(input.blobPath || '').trim();

  if (!id) return { error: 'Resource id is required.' };
  if (!title || title.length > 200) return { error: 'Title is required and must be 200 characters or fewer.' };

  const resourceDate = parseResourceDate(input.resourceDate);
  if (resourceDate.error) return { error: resourceDate.error };

  let replacement = { blobPath: null, contentType: null, sizeBytes: null };
  if (blobPath) {
    if (!blobPath.startsWith('resources/') || blobPath.includes('..')) {
      return { error: 'Blob path must be an uploaded file inside the resources folder.' };
    }
    const contentType = String(input.contentType || '').trim();
    const sizeBytes = Number(input.sizeBytes);
    if (!contentType) return { error: 'Content type is required.' };
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return { error: 'Size must be a positive number.' };
    replacement = { blobPath, contentType, sizeBytes };
  }

  return {
    value: {
      id,
      title,
      category: normalizeCategory(input.category),
      visibility: normalizeVisibility(input.visibility),
      resourceDate: resourceDate.value,
      ...replacement,
    },
  };
};

const toIsoDate = (value) => {
  if (!value) return null;
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
};

const toResourceResponse = (row) => ({
  id: row.Id,
  title: row.Title,
  fileName: displayFileName(row.BlobPath),
  contentType: row.ContentType || '',
  sizeBytes: row.SizeBytes || 0,
  category: row.Category || 'bulletin',
  visibility: row.Visibility || 'member',
  resourceDate: toIsoDate(row.ResourceDate),
  downloadUrl: `/api/files/download/${row.Id}`,
});

const listResources = async (userRoles, id) =>
  withSchema(async () => {
    const pool = await getPool();
    // Anonymous visitors are allowed here; the caller's roles decide which
    // visibility levels come back, so restricted titles never leak.
    const levels = visibleLevelsFor(userRoles);
    const request = pool.request();
    const params = levels.map((level, index) => {
      request.input(`level${index}`, sql.NVarChar(20), level);
      return `@level${index}`;
    });
    if (id) request.input('id', sql.UniqueIdentifier, id);

    const result = await request.query(`
SELECT Id, Title, BlobPath, ContentType, SizeBytes, Category, Visibility, ResourceDate
FROM dbo.Resources
WHERE Visibility IN (${params.join(', ')})
${id ? 'AND Id = @id' : ''}
ORDER BY COALESCE(ResourceDate, CAST(CreatedAt AS DATE)) DESC, CreatedAt DESC
`);
    return (result.recordset || []).map(toResourceResponse);
  });

module.exports = async function (context, req) {
  try {
    if (req.method === 'GET') {
      const principal = getClientPrincipal(req);
      const id = String((req.query && req.query.id) || '').trim();
      context.res = {
        status: 200,
        body: { resources: await listResources(principal ? principal.userRoles : [], id) },
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
        .input('category', sql.NVarChar(40), parsed.value.category)
        .input('visibility', sql.NVarChar(20), parsed.value.visibility)
        .input('resourceDate', sql.Date, parsed.value.resourceDate)
        .input('actor', sql.NVarChar(256), actor)
        .query(`
INSERT INTO dbo.Resources
  (Title, BlobPath, ContentType, SizeBytes, Category, Visibility, ResourceDate, CreatedBy, UpdatedBy)
OUTPUT inserted.Id, inserted.Title, inserted.BlobPath, inserted.ContentType, inserted.SizeBytes,
       inserted.Category, inserted.Visibility, inserted.ResourceDate
VALUES (@title, @blobPath, @contentType, @sizeBytes, @category, @visibility, @resourceDate, @actor, @actor);
`);
      context.res = { status: 201, body: { resource: toResourceResponse(inserted.recordset[0]) } };
      return;
    }

    if (req.method === 'PUT') {
      const parsed = validateResourceUpdate(req.body);
      if (parsed.error) {
        context.res = { status: 400, body: { error: parsed.error } };
        return;
      }
      const updated = await pool
        .request()
        .input('id', sql.UniqueIdentifier, parsed.value.id)
        .input('title', sql.NVarChar(200), parsed.value.title)
        .input('category', sql.NVarChar(40), parsed.value.category)
        .input('visibility', sql.NVarChar(20), parsed.value.visibility)
        .input('resourceDate', sql.Date, parsed.value.resourceDate)
        .input('blobPath', sql.NVarChar(400), parsed.value.blobPath)
        .input('contentType', sql.NVarChar(150), parsed.value.contentType)
        .input('sizeBytes', sql.BigInt, parsed.value.sizeBytes)
        .input('actor', sql.NVarChar(256), actor)
        .query(`
UPDATE dbo.Resources
SET Title = @title, Category = @category, Visibility = @visibility, ResourceDate = @resourceDate,
    BlobPath = COALESCE(@blobPath, BlobPath),
    ContentType = COALESCE(@contentType, ContentType),
    SizeBytes = COALESCE(@sizeBytes, SizeBytes),
    UpdatedBy = @actor, UpdatedAt = SYSUTCDATETIME()
OUTPUT deleted.BlobPath AS PreviousBlobPath,
       inserted.Id, inserted.Title, inserted.BlobPath, inserted.ContentType, inserted.SizeBytes,
       inserted.Category, inserted.Visibility, inserted.ResourceDate
WHERE Id = @id;
`);
      if (!updated.recordset.length) {
        context.res = { status: 404, body: { error: 'Resource not found.' } };
        return;
      }

      const row = updated.recordset[0];
      if (parsed.value.blobPath && row.PreviousBlobPath && row.PreviousBlobPath !== parsed.value.blobPath) {
        await deleteBlob(row.PreviousBlobPath, 'resources');
      }

      context.res = { status: 200, body: { resource: toResourceResponse(row) } };
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
        await deleteBlob(row.BlobPath, 'resources');
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
module.exports.validateResourceUpdate = validateResourceUpdate;
module.exports.toResourceResponse = toResourceResponse;
