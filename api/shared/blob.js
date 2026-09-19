const crypto = require('node:crypto');
const path = require('node:path');
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} = require('@azure/storage-blob');

const MAX_UPLOAD_BYTES = 26214400; // 25 MB
const ALLOWED_FOLDERS = ['resources', 'sermons', 'events'];
const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];
const UPLOAD_SAS_SECONDS = 600;
const READ_SAS_SECONDS = 300;

const getEnv = (name) => process.env[name] || '';

const buildBlobPath = (folder, fileName, id) => {
  const base = path.basename(String(fileName || 'file'));
  const safe = base.replace(/[^A-Za-z0-9._-]/g, '-').replace(/^-+/, '') || 'file';
  return `${folder}/${id}-${safe}`;
};

const validateUploadRequest = (input) => {
  const request = input || {};
  const folder = String(request.folder || '').trim().toLowerCase();
  const contentType = String(request.contentType || '').trim().toLowerCase();
  const sizeBytes = Number(request.sizeBytes);

  if (!ALLOWED_FOLDERS.includes(folder)) {
    return { error: `Folder must be one of: ${ALLOWED_FOLDERS.join(', ')}.` };
  }
  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    return { error: 'File type is not allowed. Upload PDF, image, Word, or PowerPoint files.' };
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_UPLOAD_BYTES) {
    return { error: `File must be larger than 0 and at most ${MAX_UPLOAD_BYTES} bytes.` };
  }

  return {
    value: { blobPath: buildBlobPath(folder, request.fileName, crypto.randomUUID()), contentType },
  };
};

const getCredential = () => {
  const account = getEnv('AZURE_STORAGE_ACCOUNT');
  const key = getEnv('AZURE_STORAGE_KEY');
  if (!account || !key) {
    throw new Error('Missing AZURE_STORAGE_ACCOUNT / AZURE_STORAGE_KEY.');
  }
  return { account, credential: new StorageSharedKeyCredential(account, key) };
};

const getContainerName = () => getEnv('AZURE_STORAGE_CONTAINER') || 'church-files';

const createSas = (blobPath, permissionString, seconds, contentType) => {
  const { account, credential } = getCredential();
  const containerName = getContainerName();
  const startsOn = new Date(Date.now() - 60 * 1000);
  const expiresOn = new Date(Date.now() + seconds * 1000);

  const query = generateBlobSASQueryParameters(
    {
      containerName,
      blobName: blobPath,
      permissions: BlobSASPermissions.parse(permissionString),
      startsOn,
      expiresOn,
      contentType,
    },
    credential
  ).toString();

  return `https://${account}.blob.core.windows.net/${containerName}/${encodeURI(blobPath)}?${query}`;
};

const createUploadSas = async (blobPath, contentType) => createSas(blobPath, 'cw', UPLOAD_SAS_SECONDS, contentType);

const createReadSas = async (blobPath) => createSas(blobPath, 'r', READ_SAS_SECONDS);

const deleteBlob = async (blobPath) => {
  const { account, credential } = getCredential();
  const service = new BlobServiceClient(`https://${account}.blob.core.windows.net`, credential);
  await service.getContainerClient(getContainerName()).getBlockBlobClient(blobPath).deleteIfExists();
};

module.exports = {
  MAX_UPLOAD_BYTES,
  ALLOWED_FOLDERS,
  ALLOWED_CONTENT_TYPES,
  UPLOAD_SAS_SECONDS,
  READ_SAS_SECONDS,
  buildBlobPath,
  validateUploadRequest,
  createUploadSas,
  createReadSas,
  deleteBlob,
};
