const crypto = require('node:crypto');
const path = require('node:path');
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} = require('@azure/storage-blob');

const MAX_UPLOAD_BYTES = 26214400; // 25 MB for documents and images
const MAX_MEDIA_BYTES = 209715200; // 200 MB for sermon recordings
// `media` lives in the public container so recordings stream and seek without a
// signed URL; every other folder lives in the private container.
const MEDIA_FOLDER = 'media';
const ALLOWED_FOLDERS = ['resources', 'sermons', 'events', MEDIA_FOLDER];
const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];
const ALLOWED_MEDIA_CONTENT_TYPES = [
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/x-m4a',
  'video/mp4',
  'video/webm',
];
const UPLOAD_SAS_SECONDS = 600;
const READ_SAS_SECONDS = 300;

const getEnv = (name) => process.env[name] || '';

const buildBlobPath = (folder, fileName, id) => {
  const base = path.basename(String(fileName || 'file'));
  const safe = base.replace(/[^A-Za-z0-9._-]/g, '-').replace(/^-+/, '') || 'file';
  return `${folder}/${id}-${safe}`;
};

const isPublicFolder = (folder) => folder === MEDIA_FOLDER;

const validateUploadRequest = (input) => {
  const request = input || {};
  const folder = String(request.folder || '').trim().toLowerCase();
  const contentType = String(request.contentType || '').trim().toLowerCase();
  const sizeBytes = Number(request.sizeBytes);

  if (!ALLOWED_FOLDERS.includes(folder)) {
    return { error: `Folder must be one of: ${ALLOWED_FOLDERS.join(', ')}.` };
  }

  const isMedia = isPublicFolder(folder);
  const allowedTypes = isMedia ? ALLOWED_MEDIA_CONTENT_TYPES : ALLOWED_CONTENT_TYPES;
  const maxBytes = isMedia ? MAX_MEDIA_BYTES : MAX_UPLOAD_BYTES;

  if (!allowedTypes.includes(contentType)) {
    return {
      error: isMedia
        ? 'File type is not allowed. Upload an MP3, M4A, WAV, MP4, or WebM recording.'
        : 'File type is not allowed. Upload PDF, image, Word, or PowerPoint files.',
    };
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > maxBytes) {
    return { error: `File must be larger than 0 and at most ${maxBytes} bytes.` };
  }

  return {
    value: {
      folder,
      blobPath: buildBlobPath(folder, request.fileName, crypto.randomUUID()),
      contentType,
    },
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

const getMediaContainerName = () => getEnv('AZURE_STORAGE_MEDIA_CONTAINER') || 'samilmedia';

const containerFor = (folder) => (isPublicFolder(folder) ? getMediaContainerName() : getContainerName());

const publicUrlFor = (blobPath) =>
  `https://${getEnv('AZURE_STORAGE_ACCOUNT')}.blob.core.windows.net/${getMediaContainerName()}/${encodeURI(blobPath)}`;

// Guards against a caller storing an arbitrary URL on a sermon record.
const isMediaUrl = (value) => {
  try {
    const url = new URL(String(value || ''));
    const expectedHost = `${getEnv('AZURE_STORAGE_ACCOUNT')}.blob.core.windows.net`;
    return url.hostname === expectedHost && url.pathname.startsWith(`/${getMediaContainerName()}/`);
  } catch (error) {
    return false;
  }
};

const createSas = (blobPath, permissionString, seconds, contentType, containerName = getContainerName()) => {
  const { account, credential } = getCredential();
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

const createUploadSas = async (blobPath, contentType, folder) =>
  createSas(blobPath, 'cw', UPLOAD_SAS_SECONDS, contentType, containerFor(folder));

const createReadSas = async (blobPath) => createSas(blobPath, 'r', READ_SAS_SECONDS);

const deleteBlob = async (blobPath, folder) => {
  const { account, credential } = getCredential();
  const service = new BlobServiceClient(`https://${account}.blob.core.windows.net`, credential);
  await service.getContainerClient(containerFor(folder)).getBlockBlobClient(blobPath).deleteIfExists();
};

module.exports = {
  MAX_UPLOAD_BYTES,
  MAX_MEDIA_BYTES,
  MEDIA_FOLDER,
  ALLOWED_FOLDERS,
  ALLOWED_CONTENT_TYPES,
  ALLOWED_MEDIA_CONTENT_TYPES,
  UPLOAD_SAS_SECONDS,
  READ_SAS_SECONDS,
  buildBlobPath,
  validateUploadRequest,
  isPublicFolder,
  containerFor,
  publicUrlFor,
  isMediaUrl,
  createUploadSas,
  createReadSas,
  deleteBlob,
};
