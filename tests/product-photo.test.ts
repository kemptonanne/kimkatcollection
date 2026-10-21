import { describe, expect, test } from "bun:test";
import { MAX_PHOTO_BYTES, validatePhotoFile } from "../src/lib/product-photo";
import { parseProductPhoto } from "../src/lib/product-photo.server";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aPioAAAAASUVORK5CYII=",
  "base64",
);
const dataUrl = (type: string, data: Buffer) => `data:${type};base64,${data.toString("base64")}`;
describe("product photo validation", () => {
  test("accepts a PNG and preserves its bytes", () => {
    expect(parseProductPhoto(dataUrl("image/png", png))).toEqual({
      contentType: "image/png",
      bytes: png,
    });
  });
  test("rejects active content and spoofed image types", () => {
    expect(() => parseProductPhoto(dataUrl("image/svg+xml", Buffer.from("<svg/>")))).toThrow();
    expect(() =>
      parseProductPhoto(dataUrl("image/png", Buffer.from("<script>bad</script>"))),
    ).toThrow();
    expect(() => parseProductPhoto(dataUrl("image/jpeg", png))).toThrow();
  });
  test("rejects malformed base64", () => {
    expect(() => parseProductPhoto("data:image/png;base64,%%%")).toThrow();
    expect(() => parseProductPhoto("data:image/png;base64,a")).toThrow();
  });
  test("enforces decoded size even within the encoded limit", () => {
    const large = Buffer.alloc(MAX_PHOTO_BYTES + 1);
    png.copy(large);
    expect(() => parseProductPhoto(dataUrl("image/png", large))).toThrow();
    expect(() => validatePhotoFile("image/png", 0)).toThrow();
    expect(() => validatePhotoFile("image/png", MAX_PHOTO_BYTES)).not.toThrow();
  });
});
