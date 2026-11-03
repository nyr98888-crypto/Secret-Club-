/**
 * Mobile-safe photo ingest for scrapbook snaps / polaroids.
 * - Always embeds as data: URL (never blob: — those expire)
 * - HEIC/HEIF → JPEG via native decode or heic2any
 * - Downscales to max 1200px edge + JPEG 0.85 to protect Safari memory
 */

export const PHOTO_MAX_EDGE = 1200;
export const PHOTO_JPEG_QUALITY = 0.85;

const IMAGE_ACCEPT =
  "image/*,image/heic,image/heif,image/jpeg,image/png,image/webp,.heic,.heif";

/** Prefer this on every file input that feeds the scrapbook. */
export const PHOTO_FILE_ACCEPT = IMAGE_ACCEPT;

function isHeicLike(file: File): boolean {
  const type = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  return (
    type.includes("heic") ||
    type.includes("heif") ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

async function convertHeicToJpegBlob(file: File): Promise<Blob> {
  // Safari can often decode HEIC natively — try before pulling the converter.
  try {
    const bmp = await createImageBitmap(file);
    bmp.close();
    return file;
  } catch {
    /* need conversion */
  }

  const mod = await import("heic2any");
  const heic2any = (mod.default || mod) as (opts: {
    blob: Blob;
    toType?: string;
    quality?: number;
  }) => Promise<Blob | Blob[]>;

  const out = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });
  return Array.isArray(out) ? out[0]! : out;
}

async function toDecodableBlob(file: File): Promise<Blob> {
  if (isHeicLike(file)) {
    return convertHeicToJpegBlob(file);
  }
  return file;
}

type SizedImage = {
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  release?: () => void;
};

async function loadSizedImage(blob: Blob): Promise<SizedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(blob);
      return {
        width: bmp.width,
        height: bmp.height,
        draw: (ctx, w, h) => ctx.drawImage(bmp, 0, 0, w, h),
        release: () => bmp.close(),
      };
    } catch {
      /* fall through to HTMLImageElement */
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () =>
        reject(new Error("Could not decode this photo on this device"));
      el.src = objectUrl;
    });
    return {
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
      release: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (err) {
    URL.revokeObjectURL(objectUrl);
    throw err;
  }
}

function scaleToMaxEdge(
  width: number,
  height: number,
  maxEdge: number,
): { w: number; h: number } {
  if (!width || !height) return { w: maxEdge, h: maxEdge };
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { w: width, h: height };
  const scale = maxEdge / longest;
  return {
    w: Math.max(1, Math.round(width * scale)),
    h: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Read + convert + downscale a user photo for canvas / polaroid use.
 */
export async function processPhotoFile(
  file: File,
  opts?: { maxEdge?: number; quality?: number },
): Promise<string> {
  if (!file || file.size <= 0) {
    throw new Error("No photo selected");
  }

  const maxEdge = opts?.maxEdge ?? PHOTO_MAX_EDGE;
  const quality = opts?.quality ?? PHOTO_JPEG_QUALITY;

  const blob = await toDecodableBlob(file);
  const image = await loadSizedImage(blob);
  try {
    const { w, h } = scaleToMaxEdge(image.width, image.height, maxEdge);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    image.draw(ctx, w, h);

    // Prefer JPEG for scrapbook embeds (small + universal). WebP only if tiny win.
    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (!dataUrl.startsWith("data:image/jpeg")) {
      dataUrl = canvas.toDataURL("image/png");
    }
    if (!dataUrl.startsWith("data:image/")) {
      throw new Error("Could not encode photo");
    }
    return dataUrl;
  } finally {
    image.release?.();
  }
}

/**
 * @deprecated Prefer processPhotoFile — kept as alias for older call sites.
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return processPhotoFile(file);
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
  if (
    src.startsWith("data:image/") ||
    src.startsWith("/") ||
    /^https?:/i.test(src)
  ) {
    return src;
  }
  return null;
}
