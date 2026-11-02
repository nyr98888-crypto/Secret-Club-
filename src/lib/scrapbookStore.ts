import {
  SCRAPBOOK_SPREAD_COUNT,
} from "@/lib/scrapbookPages";
import type { PlacedElementData } from "@/lib/scrapbookAssets";
import {
  DEFAULT_PAPER_ID,
  getPaperSwatch,
  type PaperId,
} from "@/lib/paperPalette";
import { sanitizePhotoSrc } from "@/lib/photoDataUrl";

export const SCRAPBOOKS_KEY = "sc_scrapbooks";
export const ACTIVE_SCRAPBOOK_KEY = "sc_active_scrapbook_id";
export const FTUE_KEY = "sc_ftue_welcome_done";

export type PageClaim = {
  memberId?: string;
  memberName: string;
  mascot: string;
  title: string;
};

export type ScrapbookSpread = {
  id: string;
  leftBackgroundSrc: string;
  rightBackgroundSrc: string;
  /** @deprecated prefer leftPageAuthor */
  leftClaim: PageClaim | null;
  /** @deprecated prefer rightPageAuthor */
  rightClaim: PageClaim | null;
  /** Sticky tab claim for the left page */
  leftPageAuthor: PageClaim | null;
  /** Sticky tab claim for the right page */
  rightPageAuthor: PageClaim | null;
  /** Soft pastel / pattern paper for both pages on this spread */
  paperId: PaperId;
  /** Explicit page fill — preferred over paperId palette lookup */
  backgroundColor?: string;
  /** Optional texture key (e.g. graph-notebook, polka-dots) */
  texturePattern?: string;
  /** Items use continuous spread coords: x 0–100 across both pages */
  elements: PlacedElementData[];
};

/** Normalize legacy claim fields onto leftPageAuthor / rightPageAuthor */
export function normalizeSpread(s: ScrapbookSpread): ScrapbookSpread {
  const leftPageAuthor = s.leftPageAuthor ?? s.leftClaim ?? null;
  const rightPageAuthor = s.rightPageAuthor ?? s.rightClaim ?? null;
  const paperId = (s.paperId as PaperId) || DEFAULT_PAPER_ID;
  // Drop expired blob: photo URLs so export never hits ERR_FILE_NOT_FOUND
  // Migrate legacy Tailwind sealColor class strings → hex gradients
  const elements = (s.elements ?? []).map((el) => {
    let nextEl = el;
    if ("photoSrc" in el && el.photoSrc != null) {
      const next = sanitizePhotoSrc(el.photoSrc);
      if (next !== el.photoSrc) nextEl = { ...nextEl, photoSrc: next };
    }
    if (
      nextEl.sealColor &&
      (nextEl.sealColor.startsWith("from-") ||
        nextEl.sealColor.includes(" to-"))
    ) {
      nextEl = {
        ...nextEl,
        sealColor: "linear-gradient(135deg, #f472b6 0%, #fb7185 100%)",
      };
    }
    return nextEl;
  });
  return {
    ...s,
    leftPageAuthor,
    rightPageAuthor,
    leftClaim: leftPageAuthor,
    rightClaim: rightPageAuthor,
    paperId,
    backgroundColor: s.backgroundColor,
    texturePattern: s.texturePattern,
    elements,
  };
}

export type StoredScrapbook = {
  id: string;
  name: string;
  themeIcon: string;
  spreads: ScrapbookSpread[];
  updatedAt: string;
};

const BACKGROUNDS = [
  "/backgrounds/pastel-grid.png",
  "/backgrounds/starry-gradient.png",
] as const;

function welcomePolaroid(): PlacedElementData {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `welcome-${Date.now()}`,
    assetId: "frame-polaroid",
    category: "frames",
    src: "",
    label: "Tap me! ♡",
    x: 25,
    y: 48,
    rotation: -3,
    width: 22,
    scale: 1,
    photoSrc: null,
    photoOffsetX: 0,
    photoOffsetY: 0,
    framePreset: "polaroid",
  };
}

export function createEmptySpreads(
  count: number = SCRAPBOOK_SPREAD_COUNT,
  opts?: { welcomePhoto?: boolean },
): ScrapbookSpread[] {
  const cream = getPaperSwatch(DEFAULT_PAPER_ID);
  return Array.from({ length: count }, (_, i) => ({
    id: `spread-${i + 1}`,
    leftBackgroundSrc: BACKGROUNDS[(i * 2) % BACKGROUNDS.length],
    rightBackgroundSrc: BACKGROUNDS[(i * 2 + 1) % BACKGROUNDS.length],
    leftClaim: null,
    rightClaim: null,
    leftPageAuthor: null,
    rightPageAuthor: null,
    paperId: DEFAULT_PAPER_ID,
    backgroundColor: cream.backgroundColor,
    texturePattern: undefined,
    elements: i === 0 && opts?.welcomePhoto ? [welcomePolaroid()] : [],
  }));
}

export function createScrapbook(input: {
  name: string;
  themeIcon?: string;
  welcomePhoto?: boolean;
}): StoredScrapbook {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sb-${Date.now()}`,
    name: input.name.trim().slice(0, 48) || "My Secret Club",
    themeIcon: input.themeIcon || "📒",
    spreads: createEmptySpreads(SCRAPBOOK_SPREAD_COUNT, {
      welcomePhoto: input.welcomePhoto,
    }),
    updatedAt: new Date().toISOString(),
  };
}

export function readScrapbooks(): StoredScrapbook[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SCRAPBOOKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredScrapbook[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s) => s && typeof s.id === "string" && Array.isArray(s.spreads))
      .map((s) => ({
        ...s,
        spreads: (s.spreads ?? []).map((sp) => normalizeSpread(sp as ScrapbookSpread)),
      }));
  } catch {
    return [];
  }
}

export function saveScrapbooks(list: StoredScrapbook[]): void {
  localStorage.setItem(SCRAPBOOKS_KEY, JSON.stringify(list));
}

export function upsertScrapbook(book: StoredScrapbook): StoredScrapbook[] {
  const list = readScrapbooks();
  const next = { ...book, updatedAt: new Date().toISOString() };
  const idx = list.findIndex((s) => s.id === book.id);
  if (idx >= 0) list[idx] = next;
  else list.unshift(next);
  saveScrapbooks(list);
  return list;
}

export function getActiveScrapbookId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_SCRAPBOOK_KEY);
}

export function setActiveScrapbookId(id: string): void {
  localStorage.setItem(ACTIVE_SCRAPBOOK_KEY, id);
}

export function readActiveScrapbook(): StoredScrapbook | null {
  const list = readScrapbooks();
  const activeId = getActiveScrapbookId();
  if (activeId) {
    const found = list.find((s) => s.id === activeId);
    if (found) return found;
  }
  return list[0] ?? null;
}

/** True when the user has never saved a scrapbook yet */
export function isBrandNewShelf(): boolean {
  return readScrapbooks().length === 0;
}

export function markFtueDone(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FTUE_KEY, "1");
}

export function isFtuePending(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(FTUE_KEY) !== "1" && isBrandNewShelf();
}

/**
 * Ensure a scrapbook exists for this club title plate.
 * Brand-new users get "My Secret Club" + a welcome polaroid on Page 1.
 */
export function ensureClubScrapbook(
  clubName: string,
  themeIcon?: string,
): StoredScrapbook {
  const list = readScrapbooks();
  if (list.length === 0) {
    const created = createScrapbook({
      name: "My Secret Club",
      themeIcon: themeIcon || "🍓",
      welcomePhoto: true,
    });
    upsertScrapbook(created);
    setActiveScrapbookId(created.id);
    markFtueDone();
    return created;
  }

  const active = readActiveScrapbook();
  if (active) {
    setActiveScrapbookId(active.id);
    return active;
  }

  const existing = list.find(
    (s) => s.name.toLowerCase() === clubName.trim().toLowerCase(),
  );
  if (existing) {
    setActiveScrapbookId(existing.id);
    return existing;
  }

  const created = createScrapbook({ name: clubName, themeIcon });
  upsertScrapbook(created);
  setActiveScrapbookId(created.id);
  return created;
}

export function renameScrapbook(id: string, name: string): StoredScrapbook | null {
  const list = readScrapbooks();
  const idx = list.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  list[idx] = {
    ...list[idx],
    name: name.trim().slice(0, 48) || list[idx].name,
    updatedAt: new Date().toISOString(),
  };
  saveScrapbooks(list);
  return list[idx];
}

/**
 * Remove a scrapbook. Refuses when it would leave the shelf empty (min 1).
 * If the deleted book was active, activates the next remaining book.
 */
export function deleteScrapbook(id: string): {
  list: StoredScrapbook[];
  removed: boolean;
  activeId: string | null;
} {
  const list = readScrapbooks();
  if (list.length <= 1) {
    return { list, removed: false, activeId: getActiveScrapbookId() };
  }
  const next = list.filter((s) => s.id !== id);
  if (next.length === list.length) {
    return { list, removed: false, activeId: getActiveScrapbookId() };
  }
  saveScrapbooks(next);
  let activeId = getActiveScrapbookId();
  if (activeId === id) {
    activeId = next[0]?.id ?? null;
    if (activeId) setActiveScrapbookId(activeId);
  }
  return { list: next, removed: true, activeId };
}

/**
 * Spawn point in continuous spread coords (0–100 across both pages).
 * Small random offset so stickers don't stack dead-center.
 * (~±3–4% ≈ ±25px on a typical page width)
 */
export function spawnOnSide(side: "left" | "right"): { x: number; y: number } {
  const baseX = side === "left" ? 25 : 75;
  return {
    x: clampPct(baseX + (Math.random() * 8 - 4)),
    y: clampPct(44 + (Math.random() * 10 - 5)),
  };
}

function clampPct(n: number) {
  return Math.min(92, Math.max(8, n));
}

/** Subtle natural scatter rotation (±6°) */
export function spawnRotation(base?: number): number {
  const jitter = Math.random() * 12 - 6;
  return (base ?? 0) + jitter;
}
