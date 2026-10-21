export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_PHOTO_DATA_URL_LENGTH = 4 * Math.ceil(MAX_PHOTO_BYTES / 3) + 32;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const PHOTO_ACCEPT = PHOTO_TYPES.join(",");

export function validatePhotoFile(type: string, size: number): void {
  if (!PHOTO_TYPES.includes(type)) throw new Error("Choose a JPEG, PNG, WebP, or GIF photo.");
  if (size <= 0 || size > MAX_PHOTO_BYTES)
    throw new Error("Each photo must be between 1 byte and 5 MB.");
}
