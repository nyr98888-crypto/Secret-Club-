export const BACKDROP_STORAGE_KEY = "secret_club_backdrop";

export type BackdropPresetId =
  | "strawberry-milk"
  | "lavender-dream"
  | "lemon-sorbet"
  | "mint-choc"
  | "cotton-candy"
  | "peach-pop"
  | "goth-fairy"
  | "unicorn"
  | "custom-hue";

export type BackdropTheme = {
  id: BackdropPresetId;
  /** CSS background value applied to the room wrapper */
  css: string;
  /** Dark mood → light header text */
  dark?: boolean;
  /** For slime mix slider (0–360) */
  hue?: number;
};

export type CandySwatch = {
  id: Exclude<BackdropPresetId, "custom-hue">;
  emoji: string;
  label: string;
  /** Tailwind gradient classes for the bubble face */
  bubbleClass: string;
  css: string;
  dark?: boolean;
};

export const CANDY_SWATCHES: CandySwatch[] = [
  {
    id: "strawberry-milk",
    emoji: "🍓",
    label: "Strawberry Milk",
    bubbleClass: "bg-gradient-to-br from-pink-200 via-rose-100 to-pink-300",
    css: "linear-gradient(160deg, #fecdd3 0%, #fff1f2 42%, #fda4af 100%)",
  },
  {
    id: "lavender-dream",
    emoji: "💜",
    label: "Lavender Dream",
    bubbleClass: "bg-gradient-to-br from-purple-200 via-violet-100 to-fuchsia-200",
    css: "linear-gradient(160deg, #e9d5ff 0%, #f5f3ff 45%, #f5d0fe 100%)",
  },
  {
    id: "lemon-sorbet",
    emoji: "🍋",
    label: "Lemon Sorbet",
    bubbleClass: "bg-gradient-to-br from-amber-200 via-yellow-100 to-orange-200",
    css: "linear-gradient(160deg, #fde68a 0%, #fef9c3 45%, #fdba74 100%)",
  },
  {
    id: "mint-choc",
    emoji: "🍃",
    label: "Mint Choc Shake",
    bubbleClass: "bg-gradient-to-br from-emerald-200 via-teal-100 to-cyan-200",
    css: "linear-gradient(160deg, #a7f3d0 0%, #ccfbf1 45%, #a5f3fc 100%)",
  },
  {
    id: "cotton-candy",
    emoji: "🍬",
    label: "Cotton Candy Sky",
    bubbleClass: "bg-gradient-to-br from-sky-200 via-blue-100 to-indigo-200",
    css: "linear-gradient(160deg, #bae6fd 0%, #dbeafe 45%, #c7d2fe 100%)",
  },
  {
    id: "peach-pop",
    emoji: "🍑",
    label: "Peach Pop",
    bubbleClass: "bg-gradient-to-br from-orange-200 via-rose-100 to-amber-200",
    css: "linear-gradient(160deg, #fed7aa 0%, #ffe4e6 45%, #fde68a 100%)",
  },
  {
    id: "goth-fairy",
    emoji: "🖤",
    label: "Goth Fairy Night",
    bubbleClass: "bg-gradient-to-br from-slate-800 via-purple-950 to-indigo-900",
    css: "linear-gradient(160deg, #1e293b 0%, #3b0764 50%, #312e81 100%)",
    dark: true,
  },
  {
    id: "unicorn",
    emoji: "🦄",
    label: "Unicorn Rainbow",
    bubbleClass: "mood-unicorn-bubble",
    css: "var(--mood-unicorn-bg)",
  },
];

export const DEFAULT_BACKDROP: BackdropTheme = {
  id: "strawberry-milk",
  css: CANDY_SWATCHES[0].css,
};

export function hueToBackdrop(hue: number): BackdropTheme {
  const h = ((hue % 360) + 360) % 360;
  return {
    id: "custom-hue",
    hue: h,
    css: `linear-gradient(160deg, hsl(${h} 85% 88%) 0%, hsl(${(h + 28) % 360} 70% 94%) 50%, hsl(${(h + 55) % 360} 80% 86%) 100%)`,
  };
}

export function readBackdropTheme(): BackdropTheme {
  if (typeof window === "undefined") return DEFAULT_BACKDROP;
  try {
    const raw = localStorage.getItem(BACKDROP_STORAGE_KEY);
    if (!raw) return DEFAULT_BACKDROP;
    const parsed = JSON.parse(raw) as BackdropTheme;
    if (!parsed?.css || !parsed?.id) return DEFAULT_BACKDROP;
    return parsed;
  } catch {
    return DEFAULT_BACKDROP;
  }
}

export function writeBackdropTheme(theme: BackdropTheme) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BACKDROP_STORAGE_KEY, JSON.stringify(theme));
}
