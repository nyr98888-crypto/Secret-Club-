import { createHmac, timingSafeEqual } from "crypto";

function pepper(): string {
  return process.env.PASSCODE_PEPPER || "dev-pepper-change-me";
}

export function normalizeGlyphs(glyphs: string[]): string[] {
  return glyphs.map((g) => g.trim()).filter(Boolean);
}

export function joinGlyphs(glyphs: string[]): string {
  return normalizeGlyphs(glyphs).join("|");
}

export function hmacPasscode(glyphs: string[]): string {
  return createHmac("sha256", pepper())
    .update(joinGlyphs(glyphs))
    .digest("hex");
}

export function buildPrefixHashes(glyphs: string[]): string[] {
  const normalized = normalizeGlyphs(glyphs);
  return normalized.map((_, i) => hmacPasscode(normalized.slice(0, i + 1)));
}

export function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export function checkPrefix(
  glyphsSoFar: string[],
  prefixHashes: string[],
): "partial" | "complete" | "wrong" {
  const n = glyphsSoFar.length;
  if (n < 1 || n > prefixHashes.length) return "wrong";
  const submitted = hmacPasscode(glyphsSoFar);
  if (!safeEqualHex(submitted, prefixHashes[n - 1])) return "wrong";
  if (n === prefixHashes.length) return "complete";
  return "partial";
}

export const STARTER_GLYPHS = [
  "🍓",
  "✨",
  "🔑",
  "🦊",
  "🌙",
  "💫",
  "🦄",
  "🌸",
  "🧃",
  "🖤",
  "⚡",
  "🦋",
  "🎀",
  "🔥",
  "👾",
  "💎",
];

export const PREMIUM_GLYPHS = [
  "👑",
  "🪩",
  "🧿",
  "🐈‍⬛",
  "🫧",
  "🎹",
  "📼",
  "🪐",
  "🗡️",
  "🪞",
  "🪽",
  "🧪",
];
