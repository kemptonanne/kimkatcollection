import { MAX_PHOTO_DATA_URL_LENGTH, validatePhotoFile } from "./product-photo";

export function parseProductPhoto(dataUrl: string) {
  if (dataUrl.length > MAX_PHOTO_DATA_URL_LENGTH)
    throw new Error("Each photo must be 5 MB or smaller.");
  const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match) throw new Error("Choose a JPEG, PNG, WebP, or GIF photo.");
  const contentType = match[1]!;
  const encoded = match[2]!;
  const bytes = Buffer.from(encoded, "base64");
  if (bytes.toString("base64") !== encoded) throw new Error("That photo could not be read.");
  validatePhotoFile(contentType, bytes.length);
  const valid =
    contentType === "image/jpeg"
      ? bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
      : contentType === "image/png"
        ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : contentType === "image/gif"
          ? ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString("ascii"))
          : bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
            bytes.subarray(8, 12).toString("ascii") === "WEBP";
  if (!valid) throw new Error("The photo contents do not match its file type.");
  return { contentType, bytes };
}
