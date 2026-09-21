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
const MEDIA_FOLDER = 'media';
const SITE_FOLDER = 'site';
// Public media streams without a signed URL, and homepage images must also be
// available to anonymous visitors. Other folders live in the private container.
const ALLOWED_FOLDERS = ['resources', 'sermons', 'events', MEDIA_FOLDER, SITE_FOLDER];
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
const ALLOWED_SITE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOAD_SAS_SECONDS = 600;
const READ_SAS_SECONDS = 300;

const getEnv = (name) => process.env[name] || '';

// Blob names may hold Unicode, so keep Korean names readable. Only strip what
// is genuinely unsafe: path separators, control characters, and the Windows
// reserved set. An all-unsafe name would otherwise collapse to its extension.
const UNSAFE_IN_NAME = /[\\/:*?"<>|\u0000-\u001f]/g;

const buildBlobPath = (folder, fileName, id) => {
  const base = path.basename(String(fileName || '').replace(/\\/g, '/'));
  const safe =
    base
      .replace(UNSAFE_IN_NAME, '')
      .replace(/\s+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^[-.]+/, '')
      .trim() || 'file';
  return `${folder}/${id}-${safe}`;
};

const isPublicFolder = (folder) => folder === MEDIA_FOLDER || folder === SITE_FOLDER;

const validateUploadRequest = (input) => {
  const request = input || {};
  const folder = String(request.folder || '').trim().toLowerCase();
  const contentType = String(request.contentType || '').trim().toLowerCase();
  const sizeBytes = Number(request.sizeBytes);

  if (!ALLOWED_FOLDERS.includes(folder)) {
    return { error: `Folder must be one of: ${ALLOWED_FOLDERS.join(', ')}.` };
  }

  const isMedia = folder === MEDIA_FOLDER;
  const isSite = folder === SITE_FOLDER;
  const allowedTypes = isMedia
    ? ALLOWED_MEDIA_CONTENT_TYPES
    : isSite
      ? ALLOWED_SITE_CONTENT_TYPES
      : ALLOWED_CONTENT_TYPES;
  const maxBytes = isMedia ? MAX_MEDIA_BYTES : MAX_UPLOAD_BYTES;

  if (!allowedTypes.includes(contentType)) {
    return {
      error: isMedia
        ? 'File type is not allowed. Upload an MP3, M4A, WAV, MP4, or WebM recording.'
        : isSite
          ? 'File type is not allowed. Upload a JPEG, PNG, or WebP image.'
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

const GENERATED_PREFIX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i;
const INLINE_READ_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

// Uploads are stored as `<uuid>-<original name>`. Readers and editors see
// the original name; the storage path itself stays inside the API.
const displayFileName = (blobPath) => {
  const last = String(blobPath || '').split('/').pop() || '';
  return last.replace(GENERATED_PREFIX, '');
};

const asciiFileName = (name) => {
  const stripped = String(name || '')
    .replace(/["\\\r\n;]/g, '')
    .replace(/[^\x20-\x7E]/g, '_');
  return stripped.replace(/^_+|_+$/g, '') || 'file';
};

const readDisposition = (fileName, contentType) => {
  const raw = String(fileName || '').trim() || 'file';
  const kind = INLINE_READ_TYPES.has(String(contentType || '').trim().toLowerCase())
    ? 'inline'
    : 'attachment';
  return `${kind}; filename="${asciiFileName(raw)}"; filename*=UTF-8''${encodeURIComponent(raw)}`;
};

const createSas = (blobPath, permissionString, seconds, contentType, containerName = getContainerName(), contentDisposition) => {
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
      contentDisposition,
    },
    credential
  ).toString();

  return `https://${account}.blob.core.windows.net/${containerName}/${encodeURI(blobPath)}?${query}`;
};

const createUploadSas = async (blobPath, contentType, folder) =>
  createSas(blobPath, 'cw', UPLOAD_SAS_SECONDS, contentType, containerFor(folder));

const createReadSas = async (blobPath, options = {}) =>
  createSas(blobPath, 'r', READ_SAS_SECONDS, undefined, getContainerName(), options.contentDisposition);

const deleteBlob = async (blobPath, folder) => {
  const { account, credential } = getCredential();
  const service = new BlobServiceClient(`https://${account}.blob.core.windows.net`, credential);
  await service.getContainerClient(containerFor(folder)).getBlockBlobClient(blobPath).deleteIfExists();
};

module.exports = {
  MAX_UPLOAD_BYTES,
  MAX_MEDIA_BYTES,
  MEDIA_FOLDER,
  SITE_FOLDER,
  ALLOWED_FOLDERS,
  ALLOWED_CONTENT_TYPES,
  ALLOWED_MEDIA_CONTENT_TYPES,
  ALLOWED_SITE_CONTENT_TYPES,
  UPLOAD_SAS_SECONDS,
  READ_SAS_SECONDS,
  buildBlobPath,
  validateUploadRequest,
  isPublicFolder,
  containerFor,
  publicUrlFor,
  isMediaUrl,
  displayFileName,
  readDisposition,
  createUploadSas,
  createReadSas,
  deleteBlob,
};
