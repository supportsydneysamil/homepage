const { requireRole, ROLES } = require('../shared/principal');
const { validateUploadRequest, createUploadSas, UPLOAD_SAS_SECONDS } = require('../shared/blob');

module.exports = async function (context, req) {
  const auth = requireRole(req, ROLES.EDITOR);
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
    const uploadUrl = await createUploadSas(parsed.value.blobPath, parsed.value.contentType);
    context.res = {
      status: 200,
      body: { uploadUrl, blobPath: parsed.value.blobPath, expiresInSeconds: UPLOAD_SAS_SECONDS },
    };
  } catch (error) {
    context.log.error('files-upload-url error:', (error && error.message) || error);
    context.res = { status: 500, body: { error: 'Unable to issue an upload URL.' } };
  }
};
