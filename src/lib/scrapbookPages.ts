import type { ScrapbookPageData } from "@/components/ScrapbookCanvas";

const BACKGROUNDS = [
  "/backgrounds/pastel-grid.png",
  "/backgrounds/starry-gradient.png",
] as const;

/** Standard children's memory album: 10 spreads = 20 pages */
export const SCRAPBOOK_SPREAD_COUNT = 10;
export const SCRAPBOOK_PAGE_COUNT = SCRAPBOOK_SPREAD_COUNT * 2;

export function createDefaultScrapbookPages(
  pageCount: number = SCRAPBOOK_PAGE_COUNT,
): ScrapbookPageData[] {
  return Array.from({ length: pageCount }, (_, i) => ({
    id: `p${i + 1}`,
    backgroundSrc: BACKGROUNDS[i % BACKGROUNDS.length],
    elements: [],
    notes: [],
  }));
}
