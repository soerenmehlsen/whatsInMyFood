// Client-side image compression: scales the longest edge down to `maxEdge`
// and re-encodes as JPEG. createImageBitmap with imageOrientation "from-image"
// applies EXIF rotation so phone photos aren't sent sideways (which would hurt
// OCR). Re-encoding also converts to JPEG where the browser can decode the
// source (e.g. HEIC on Safari; non-Apple browsers may not decode HEIC).
export async function compressImage(
  file: File,
  maxEdge = 1600,
  quality = 0.8,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get canvas 2D context");
    }
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) {
      throw new Error("Failed to encode image");
    }
    return blob;
  } finally {
    bitmap.close();
  }
}
