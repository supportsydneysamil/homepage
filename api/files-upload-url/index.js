const { requireRole, ROLES } = require('../shared/principal');
const {
  validateUploadRequest,
  createUploadSas,
  isPublicFolder,
  publicUrlFor,
  UPLOAD_SAS_SECONDS,
} = require('../shared/blob');

const defaultDeps = { createUploadSas };

module.exports = async function (context, req, deps = defaultDeps) {
  const folder = String((req.body && req.body.folder) || '').trim().toLowerCase();
  const auth = requireRole(req, folder === 'site' ? ROLES.ADMIN : ROLES.EDITOR);
  if (auth.error) {
    context.res = { status: auth.error.status, body: auth.error.body };
    return;
  }

  const parsed = validateUploadRequest(req.body);
  if (parsed.error) {
    context.res = { status: 400, body: { error: parsed.error } };
    return;
  }

  try {
    const uploadUrl = await deps.createUploadSas(
      parsed.value.blobPath,
      parsed.value.contentType,
      parsed.value.folder
    );
    context.res = {
      status: 200,
      body: {
        uploadUrl,
        blobPath: parsed.value.blobPath,
        publicUrl: isPublicFolder(parsed.value.folder) ? publicUrlFor(parsed.value.blobPath) : null,
        expiresInSeconds: UPLOAD_SAS_SECONDS,
      },
    };
  } catch (error) {
    context.log.error('files-upload-url error:', (error && error.message) || error);
    context.res = { status: 500, body: { error: 'Unable to issue an upload URL.' } };
  }
};
