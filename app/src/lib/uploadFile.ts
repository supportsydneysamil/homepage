// These limits must stay in sync with api/shared/blob.js.
export const MAX_UPLOAD_BYTES = 26214400;
export const MAX_MEDIA_BYTES = 209715200;

export const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

export const ALLOWED_MEDIA_CONTENT_TYPES = [
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/x-m4a',
  'video/mp4',
  'video/webm',
];

const ALLOWED_SITE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type UploadFolder = 'resources' | 'sermons' | 'events' | 'media' | 'site';

export const validateFileForUpload = (
  file: { size: number; type: string },
  folder: UploadFolder = 'resources'
): string | null => {
  const isMedia = folder === 'media';
  const isSite = folder === 'site';
  const allowed = isMedia
    ? ALLOWED_MEDIA_CONTENT_TYPES
    : isSite
      ? ALLOWED_SITE_CONTENT_TYPES
      : ALLOWED_CONTENT_TYPES;
  const maxBytes = isMedia ? MAX_MEDIA_BYTES : MAX_UPLOAD_BYTES;

  if (!file.size) return 'empty';
  if (file.size > maxBytes) return 'tooLarge';
  if (!allowed.includes(file.type)) return 'badType';
  return null;
};

export const uploadFile = async (file: File, folder: UploadFolder) => {
  const problem = validateFileForUpload(file, folder);
  if (problem) {
    throw new Error(problem);
  }

  const sasRes = await fetch('/api/files/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ folder, fileName: file.name, contentType: file.type, sizeBytes: file.size }),
  });

  if (!sasRes.ok) {
    throw new Error(`uploadUrlFailed:${sasRes.status}`);
  }

  const { uploadUrl, blobPath, publicUrl } = (await sasRes.json()) as {
    uploadUrl: string;
    blobPath: string;
    publicUrl: string | null;
  };

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': file.type },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error(`uploadFailed:${putRes.status}`);
  }

  return { blobPath, publicUrl, contentType: file.type, sizeBytes: file.size };
};
