// These limits must stay in sync with api/shared/blob.js.
export const MAX_UPLOAD_BYTES = 26214400;

export const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

export type UploadFolder = 'resources' | 'sermons' | 'events';

export const validateFileForUpload = (file: { size: number; type: string }): string | null => {
  if (!file.size) return 'empty';
  if (file.size > MAX_UPLOAD_BYTES) return 'tooLarge';
  if (!ALLOWED_CONTENT_TYPES.includes(file.type)) return 'badType';
  return null;
};

export const uploadFile = async (file: File, folder: UploadFolder) => {
  const problem = validateFileForUpload(file);
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

  const { uploadUrl, blobPath } = (await sasRes.json()) as { uploadUrl: string; blobPath: string };

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': file.type },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error(`uploadFailed:${putRes.status}`);
  }

  return { blobPath, contentType: file.type, sizeBytes: file.size };
};
