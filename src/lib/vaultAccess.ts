/**
 * Client-side Bestie Vault access + freemium teaser tier.
 * VIP proof: `_sc_auth_sig` (HMAC), `secret_club_vip_unlocked`,
 * and/or `sc_vip_membership_v1` via vipAuth.
 */

import { STICKER_TABS, stickersForTab } from "@/constants/stickers";
import { WASHI_TAPES } from "@/lib/washiTapes";
import { checkIsVIP, clearVIPMembership } from "@/lib/vipAuth";

export const AUTH_SIG_KEY = "_sc_auth_sig";
/** Device flag set by promo `?key=` VIP passes */
export const VIP_UNLOCK_FLAG = "sc_vip_unlocked";
export const VIP_ASSIGNED_KEY = "sc_assigned_key";

/** First N stickers free in every category (all 13 packs). */
export const FREE_ITEMS_PER_PACK = 3;

/**
 * Specialty packs (UI hint only) — free teaser stickers still apply.
 */
export const PREMIUM_STICKER_TABS = [
  "chibis",
  "coquette",
  "locks",
] as const;

/** Free sound charms by SweetPoke id — Bestie Pop + Ding Dong */
export const FREE_POKE_IDS = ["bestie-pop", "ding-dong"] as const;

/** Free users can fully design sheets 1–5; sheet 6+ opens the vault modal. */
export const FREE_SHEET_LIMIT = 5;

/** Free scrapbooks on the bookshelf (separate from sheet pages). */
export const FREE_SCRAPBOOK_LIMIT = 3;

/** Warm Cream Craft, Pastel Pink Grid, Mint Notebook Lines */
export const FREE_PAPER_IDS = [
  "clean-cream",
  "pink-grid",
  "pastel-lined",
] as const;

/** Classic Polaroid + Doodle Scrap — enough to snap & frame for free */
export const FREE_FRAME_PRESETS = ["polaroid", "doodle"] as const;

/** Free gem cuts for the Gems tray (asset ids are `gem-${cutId}`). */
export const FREE_GEM_IDS = [
  "gem-heart-sapphire",
  "gem-star-prism",
  "gem-teardrop-emerald",
  "gem-brilliant-diamond",
  "gem-amethyst-cushion",
  "gem-daisy-blossom",
  "gem-opal-crescent",
  "gem-ring-pop-hex",
] as const;

/** Premium exclusives — always vault-gated (holographic / chrome). */
export const PREMIUM_FRAME_PRESETS = ["holo_sleeve", "gold_mirror"] as const;
export const PREMIUM_PAPER_IDS = ["holographic-starlight", "cyber-black"] as const;
export const PREMIUM_WASHI_IDS = ["gold-hologram", "y2k-cyber-neon"] as const;

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
  clearVIPMembership();
  window.dispatchEvent(new CustomEvent("sc:vault-locked"));
}

export function readVaultAccess(): VaultAccessState {
  const token = getStoredAuthSig();
  if (token) return { isVip: true, token };
  if (checkIsVIP()) return { isVip: true, token: null };
  return { isVip: false, token: null };
}

/** Items at index 0..FREE_ITEMS_PER_PACK-1 are free; index >= N are VIP. */
export function isStickerLocked(
  indexInCategory: number,
  isVIP: boolean,
): boolean {
  if (isVIP) return false;
  return indexInCategory >= FREE_ITEMS_PER_PACK;
}

export function isFreePokeId(pokeId: string): boolean {
  return (FREE_POKE_IDS as readonly string[]).includes(pokeId);
}

export function isFreePaper(paperId: string): boolean {
  return (FREE_PAPER_IDS as readonly string[]).includes(paperId);
}

export function isPremiumPaper(paperId: string): boolean {
  return (PREMIUM_PAPER_IDS as readonly string[]).includes(paperId);
}

export function isFreeFramePreset(preset?: string | null): boolean {
  if (!preset) return true;
  return (FREE_FRAME_PRESETS as readonly string[]).includes(preset);
}

export function isPremiumFramePreset(preset?: string | null): boolean {
  if (!preset) return false;
  return (PREMIUM_FRAME_PRESETS as readonly string[]).includes(preset);
}

export function isFreeGemId(id: string): boolean {
  return (FREE_GEM_IDS as readonly string[]).includes(id);
}

export function isPremiumWashiId(id: string): boolean {
  return (PREMIUM_WASHI_IDS as readonly string[]).includes(id);
}

/** First FREE_ITEMS_PER_PACK washi tapes (excluding premium exclusives). */
export function getFreeWashiIds(): Set<string> {
  const ids = new Set<string>();
  for (const tape of WASHI_TAPES) {
    if (isPremiumWashiId(tape.id)) continue;
    ids.add(`washi-${tape.id}`);
    if (ids.size >= FREE_ITEMS_PER_PACK) break;
  }
  return ids;
}

export function isPremiumStickerTab(tabId: string): boolean {
  return (PREMIUM_STICKER_TABS as readonly string[]).includes(tabId);
}

/** First 3 stickers free in every one of the 13 categories. */
export function buildFreeStickerIds(): Set<string> {
  const ids = new Set<string>();
  for (const tab of STICKER_TABS) {
    for (const sticker of stickersForTab(tab.id).slice(0, FREE_ITEMS_PER_PACK)) {
      ids.add(sticker.id);
    }
  }
  return ids;
}

export function canUseSheetPage(pageNumber: number, isVip: boolean): boolean {
  if (isVip) return true;
  return pageNumber <= FREE_SHEET_LIMIT;
}

/** @deprecated Tabs are no longer wholly VIP — free starters exist in every pack. */
export function isVipStickerTab(_tabId: string): boolean {
  return false;
}

/** @deprecated Prefer per-item free lists; categories are browsable. */
export function isVipCategory(_category: string): boolean {
  return false;
}
