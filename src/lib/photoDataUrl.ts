/**
 * Read a user photo file as an embedded base64 data URL.
 * Never use URL.createObjectURL — blob: URLs expire and break export
 * (net::ERR_FILE_NOT_FOUND) after reload.
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string" && reader.result.startsWith("data:")) {
        resolve(reader.result);
        return;
      }
      reject(new Error("Could not read photo as data URL"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
    reader.readAsDataURL(file);
  });
}

/** True for durable embedded images (safe for html-to-image / localStorage). */
export function isEmbeddedPhotoSrc(src?: string | null): boolean {
  if (!src) return false;
  return src.startsWith("data:image/");
}

/**
 * Drop expired blob: URLs so the empty frame prompt returns
 * instead of a broken image that crashes export.
 */
export function sanitizePhotoSrc(src?: string | null): string | null {
  if (!src) return null;
  if (src.startsWith("blob:")) return null;
  if (src.startsWith("data:image/") || src.startsWith("/") || /^https?:/i.test(src)) {
    return src;
  }
  return null;
}
