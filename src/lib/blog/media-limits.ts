/**
 * Upload size limits for blog article media, shared between the client-side
 * dropzones (which reject oversized files before upload) and the server
 * actions in `articles.ts` (which re-check them before hitting Cloudinary).
 */

export const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
export const MAX_GALLERY_IMAGES = 6;

/**
 * Formats a byte count as a human-readable KB/MB string for error messages
 * and dropzone labels.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
