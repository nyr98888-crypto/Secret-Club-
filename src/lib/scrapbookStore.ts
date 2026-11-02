import {
  SCRAPBOOK_SPREAD_COUNT,
} from "@/lib/scrapbookPages";
import type { PlacedElementData } from "@/lib/scrapbookAssets";
import { DEFAULT_PAPER_ID, type PaperId } from "@/lib/paperPalette";

export const SCRAPBOOKS_KEY = "sc_scrapbooks";
export const ACTIVE_SCRAPBOOK_KEY = "sc_active_scrapbook_id";

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
  return {
    ...s,
    leftPageAuthor,
    rightPageAuthor,
    leftClaim: leftPageAuthor,
    rightClaim: rightPageAuthor,
    paperId,
    backgroundColor: s.backgroundColor,
    texturePattern: s.texturePattern,
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

export function createEmptySpreads(
  count: number = SCRAPBOOK_SPREAD_COUNT,
): ScrapbookSpread[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `spread-${i + 1}`,
    leftBackgroundSrc: BACKGROUNDS[(i * 2) % BACKGROUNDS.length],
    rightBackgroundSrc: BACKGROUNDS[(i * 2 + 1) % BACKGROUNDS.length],
    leftClaim: null,
    rightClaim: null,
    leftPageAuthor: null,
    rightPageAuthor: null,
    paperId: DEFAULT_PAPER_ID,
    backgroundColor: "#fff1f2",
    texturePattern: undefined,
    elements: [],
  }));
}

export function createScrapbook(input: {
  name: string;
  themeIcon?: string;
}): StoredScrapbook {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sb-${Date.now()}`,
    name: input.name.trim().slice(0, 48) || "My Scrapbook",
    themeIcon: input.themeIcon || "📒",
    spreads: createEmptySpreads(),
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

/** Ensure a scrapbook exists for this club title plate */
export function ensureClubScrapbook(clubName: string, themeIcon?: string): StoredScrapbook {
  const list = readScrapbooks();
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

/** Spawn point in continuous spread coords (0–100 across both pages) */
export function spawnOnSide(side: "left" | "right"): { x: number; y: number } {
  const baseX = side === "left" ? 25 : 75;
  return {
    x: baseX + (Math.random() * 10 - 5),
    y: 42 + (Math.random() * 12 - 6),
  };
}
