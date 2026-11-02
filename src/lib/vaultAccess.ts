/**
 * Client-side Bestie Vault access + free-tier gates.
 * VIP proof lives in localStorage as `_sc_auth_sig` (HMAC token from /api/license/verify).
 */

export const AUTH_SIG_KEY = "_sc_auth_sig";

export const FREE_STICKER_LIMIT = 25;
export const FREE_SCRAPBOOK_LIMIT = 1;
export const FREE_PAPER_IDS = [
  "clean-cream",
  "pink-grid",
  "dot-journal",
] as const;
export const FREE_FRAME_PRESETS = ["polaroid", "pink_polaroid"] as const;

/** Categories that require VIP for free users (entire tray). */
export const VIP_ONLY_CATEGORIES = [
  "gems",
  "washi",
  "pokes",
] as const;

export type VaultAccessState = {
  isVip: boolean;
  token: string | null;
};

function readRawToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(AUTH_SIG_KEY);
  } catch {
    return null;
  }
}

/**
 * Structural check for `email:licenseKey:timestamp.signature`.
 * Cryptographic verify happens server-side; this gates the free UI.
 */
export function isAuthSigFormatValid(token: string | null | undefined): boolean {
  if (!token || typeof token !== "string") return false;
  const dot = token.lastIndexOf(".");
  if (dot < 1 || dot === token.length - 1) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^[0-9a-f]{32,}$/i.test(sig)) return false;
  const parts = payload.split(":");
  if (parts.length < 3) return false;
  const ts = Number(parts[parts.length - 1]);
  if (!Number.isFinite(ts)) return false;
  // Reject absurdly old / future tokens (5y window)
  const age = Date.now() - ts;
  if (age < -60_000 || age > 1000 * 60 * 60 * 24 * 365 * 5) return false;
  return true;
}

export function getStoredAuthSig(): string | null {
  const token = readRawToken();
  return isAuthSigFormatValid(token) ? token : null;
}

/** Persist a verified proof token from /api/license/verify. */
export function unlockVault(token: string): void {
  if (typeof window === "undefined") return;
  if (!isAuthSigFormatValid(token)) {
    throw new Error("Invalid vault unlock token");
  }
  localStorage.setItem(AUTH_SIG_KEY, token);
  window.dispatchEvent(new CustomEvent("sc:vault-unlocked"));
}

export function clearVaultUnlock(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_SIG_KEY);
  window.dispatchEvent(new CustomEvent("sc:vault-locked"));
}

export function readVaultAccess(): VaultAccessState {
  const token = getStoredAuthSig();
  return { isVip: Boolean(token), token };
}

export function isVipCategory(
  category: string,
): category is (typeof VIP_ONLY_CATEGORIES)[number] {
  return (VIP_ONLY_CATEGORIES as readonly string[]).includes(category);
}

export function isFreePaper(paperId: string): boolean {
  return (FREE_PAPER_IDS as readonly string[]).includes(paperId);
}

export function isFreeFramePreset(preset?: string | null): boolean {
  if (!preset) return true;
  return (FREE_FRAME_PRESETS as readonly string[]).includes(preset);
}

/** Charms sticker tab is VIP-only on free tier. */
export function isVipStickerTab(tabId: string): boolean {
  return tabId === "charms" || tabId === "y2k-cyber";
}
