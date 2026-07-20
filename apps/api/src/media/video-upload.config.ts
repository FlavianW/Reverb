/** Taille max de l'upload original (avant transcodage) — quelques minutes de vidéo à qualité correcte. */
export const MAX_VIDEO_SIZE_BYTES = 150 * 1024 * 1024;

export const VIDEO_EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
};

/** Formats acceptés à l'upload (avant transcodage vers un rendu H.264/AAC uniforme). */
export function isAllowedVideoMimeType(
  mimeType: string,
): mimeType is keyof typeof VIDEO_EXTENSION_BY_MIME_TYPE {
  return mimeType in VIDEO_EXTENSION_BY_MIME_TYPE;
}
