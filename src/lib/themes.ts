import type { Aesthetic, CircleMode } from "./types";

export const AESTHETICS: {
  id: Aesthetic;
  label: string;
  blurb: string;
}[] = [
  { id: "retro_y2k", label: "Retro Y2K", blurb: "Chrome hearts & butterfly clips" },
  {
    id: "kawaii_pastel",
    label: "Kawaii Pastel",
    blurb: "Soft sparkle sugar rush",
  },
  {
    id: "goth_cottagecore",
    label: "Goth Cottagecore",
    blurb: "Mossy secrets after dark",
  },
  {
    id: "cyber_pixel",
    label: "Cyber Pixel",
    blurb: "Neon grid & glitch seals",
  },
];

export const CIRCLE_MODES: {
  id: CircleMode;
  label: string;
  blurb: string;
}[] = [
  { id: "bestie", label: "BestieVault", blurb: "Just the two of you" },
  { id: "squad", label: "SquadVault", blurb: "A tight circle of 3–4" },
];

export function rootDomainForCircle(mode: CircleMode): string {
  if (typeof window !== "undefined") {
    // Prefer configured public URL host in browser when set via meta; else mode brand.
  }
  return mode === "squad" ? "https://squadvault.app" : "https://bestievault.app";
}

export function clubNameIdeas(): string[] {
  return [
    "Strawberry Club",
    "Glitter Squad",
    "Midnight Fairies",
    "Secret Stars",
    "Bubblegum Besties",
    "Rainbow Lockers",
    "Sparkle Pandas",
    "Cotton Candy Crew",
    "Moon Cookie Club",
    "Princess Pixel",
    "Fuzzy Diary Gang",
    "Cherry Bomb Friends",
  ];
}
