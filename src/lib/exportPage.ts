/**
 * Capture the active scrapbook surface as a PNG (kid-friendly Save / Print).
 * Uses html-to-image only — never html2canvas (oklab crash).
 * Falls back to a native 2D canvas redraw if html-to-image fails.
 */

import { toPng } from "html-to-image";

export const DESELECT_EVENT = "sc:deselect-canvas";

function waitFrames(n = 2): Promise<void> {
  return new Promise((resolve) => {
    const step = (left: number) => {
      if (left <= 0) resolve();
      else requestAnimationFrame(() => step(left - 1));
    };
    step(n);
  });
}

/** Clear selection chrome before capture so handles never appear in the PNG. */
async function prepareForExport(): Promise<void> {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DESELECT_EVENT));
  await waitFrames(2);
}

function exportFilter(node: HTMLElement): boolean {
  if (!(node instanceof HTMLElement)) return true;
  if (node.classList?.contains("export-ignore")) return false;
  if (node.classList?.contains("no-export")) return false;
  if (node.classList?.contains("print-hide")) return false;
  if (node.dataset.printHide === "true") return false;
  return true;
}

function cssColorToRgb(color: string): string {
  if (!color || color === "transparent") return "rgba(0,0,0,0)";
  if (!/oklab|oklch|color-mix|color\(/i.test(color)) return color;
  try {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return "#ffffff";
    ctx.fillStyle = "#000000";
    ctx.fillStyle = color;
    return String(ctx.fillStyle);
  } catch {
    return "#ffffff";
  }
}

/** Last-resort: paint paper fill + images onto a plain canvas (no CSS parser). */
async function captureWithPlainCanvas(
  root: HTMLElement,
): Promise<string> {
  const rect = root.getBoundingClientRect();
  const ratio = Math.min(2, window.devicePixelRatio || 2);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");

  ctx.scale(ratio, ratio);
  const bg = window.getComputedStyle(root).backgroundColor || "#ffffff";
  ctx.fillStyle = cssColorToRgb(bg);
  ctx.fillRect(0, 0, rect.width, rect.height);

  const imgs = Array.from(root.querySelectorAll("img")).filter((img) => {
    if (!exportFilter(img)) return false;
    if (!img.complete || img.naturalWidth <= 0) return false;
    // Skip dead blob: pointers — they throw ERR_FILE_NOT_FOUND
    if (img.currentSrc.startsWith("blob:") || img.src.startsWith("blob:")) {
      return false;
    }
    return true;
  });

  for (const img of imgs) {
    const r = img.getBoundingClientRect();
    try {
      ctx.drawImage(
        img,
        r.left - rect.left,
        r.top - rect.top,
        r.width,
        r.height,
      );
    } catch {
      /* tainted / CORS — skip */
    }
  }

  return canvas.toDataURL("image/png");
}

async function captureDataUrl(root: HTMLElement): Promise<string> {
  await prepareForExport();

  try {
    return await toPng(root, {
      cacheBust: true,
      pixelRatio: 2,
      skipFonts: true,
      backgroundColor: "#ffffff",
      filter: exportFilter,
      // Prefer embedded data URLs; skip broken blob: fetches
      imagePlaceholder:
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
    });
  } catch (err) {
    console.warn("html-to-image failed, using native canvas fallback", err);
    return captureWithPlainCanvas(root);
  }
}

function triggerDownload(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function shareDataUrl(
  dataUrl: string,
  fileName: string,
): Promise<"shared" | "downloaded"> {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], fileName, { type: "image/png" });
    const nav = typeof navigator !== "undefined" ? navigator : null;
    if (
      nav &&
      typeof nav.share === "function" &&
      (!nav.canShare || nav.canShare({ files: [file] }))
    ) {
      try {
        await nav.share({ files: [file], title: "Secret Club page" });
        return "shared";
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return "shared";
        }
      }
    }
  } catch {
    /* fall through to download */
  }

  triggerDownload(dataUrl, fileName);
  return "downloaded";
}

/**
 * Primary export API — html-to-image → native canvas → download/share.
 * Never calls html2canvas (oklab crash).
 */
export async function exportScrapbookPage(
  node: HTMLElement,
  fileName = "secret-club-page.png",
): Promise<boolean> {
  try {
    const dataUrl = await captureDataUrl(node);
    await shareDataUrl(dataUrl, fileName);
    return true;
  } catch (err) {
    console.error("Export failed:", err);
    return false;
  }
}

/** @deprecated Prefer exportScrapbookPage — kept for PrintExportActions */
export async function saveCanvasPng(
  root: HTMLElement,
  filename = "secret-club-page.png",
): Promise<void> {
  const ok = await exportScrapbookPage(root, filename);
  if (!ok) throw new Error("Export failed");
}

/** @deprecated Prefer capture via exportScrapbookPage */
export async function captureCanvasPng(
  root: HTMLElement,
): Promise<HTMLCanvasElement> {
  const dataUrl = await captureDataUrl(root);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("PNG decode failed"));
    img.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  ctx.drawImage(img, 0, 0);
  return canvas;
}

export async function printCanvas(root: HTMLElement): Promise<void> {
  try {
    await prepareForExport();
    root.setAttribute("data-printing", "true");
    window.print();
  } finally {
    window.setTimeout(() => root.removeAttribute("data-printing"), 800);
  }
}
