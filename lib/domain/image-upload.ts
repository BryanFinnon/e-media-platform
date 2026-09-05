export const supportedImageTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
} as const;

export type SupportedImageType = keyof typeof supportedImageTypes;

function matches(bytes: Uint8Array, offset: number, signature: readonly number[]) {
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

function isJpeg(bytes: Uint8Array) {
  return (
    bytes.length >= 5 &&
    matches(bytes, 0, [0xff, 0xd8, 0xff]) &&
    matches(bytes, bytes.length - 2, [0xff, 0xd9])
  );
}

function isPng(bytes: Uint8Array) {
  return (
    bytes.length >= 20 &&
    matches(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) &&
    matches(bytes, bytes.length - 12, [
      0x00, 0x00, 0x00, 0x00,
      0x49, 0x45, 0x4e, 0x44,
      0xae, 0x42, 0x60, 0x82,
    ])
  );
}

function isGif(bytes: Uint8Array) {
  const hasHeader =
    matches(bytes, 0, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    matches(bytes, 0, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
  return bytes.length >= 7 && hasHeader && bytes[bytes.length - 1] === 0x3b;
}

function isWebp(bytes: Uint8Array) {
  if (
    bytes.length < 12 ||
    !matches(bytes, 0, [0x52, 0x49, 0x46, 0x46]) ||
    !matches(bytes, 8, [0x57, 0x45, 0x42, 0x50])
  ) {
    return false;
  }

  const declaredSize =
    bytes[4] |
    (bytes[5] << 8) |
    (bytes[6] << 16) |
    (bytes[7] << 24);
  return declaredSize >= 4 && declaredSize === bytes.length - 8;
}

export function detectImageType(bytes: Uint8Array): SupportedImageType | null {
  if (isJpeg(bytes)) return "image/jpeg";
  if (isPng(bytes)) return "image/png";
  if (isWebp(bytes)) return "image/webp";
  if (isGif(bytes)) return "image/gif";
  return null;
}
