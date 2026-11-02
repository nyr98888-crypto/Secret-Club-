export const BACKDROP_STORAGE_KEY = "secret_club_backdrop";

export type BackdropPresetId =
  | "strawberry-pop"
  | "electric-grape"
  | "cotton-candy"
  | "neon-lemonade"
  | "mint-bubblegum"
  | "peach-sunset"
  | "midnight-starlight"
  | "rainbow-swirl"
  | "barbie-core"
  | "aqua-mermaid"
  /** Legacy ids (mapped on read) */
  | "strawberry-milk"
  | "lavender-dream"
  | "lemon-sorbet"
  | "mint-choc"
  | "peach-pop"
  | "goth-fairy"
  | "unicorn"
  | "custom-hue";

export type BackdropTheme = {
  id: BackdropPresetId;
  /** CSS background-image value applied to the room wrapper */
  css: string;
  /** Dark mood → light header text */
  dark?: boolean;
  /** For slime mix slider (0–360) */
  hue?: number;
};

export type CandySwatch = {
  id: Exclude<
    BackdropPresetId,
    | "custom-hue"
    | "strawberry-milk"
    | "lavender-dream"
    | "lemon-sorbet"
    | "mint-choc"
    | "peach-pop"
    | "goth-fairy"
    | "unicorn"
  >;
  emoji: string;
  label: string;
  /** Tailwind gradient classes for the bubble face */
  bubbleClass: string;
  css: string;
  dark?: boolean;
};

/** Saturated candy Room Vibes — kids love rich, punchy hues */
export const CANDY_SWATCHES: CandySwatch[] = [
  {
    id: "strawberry-pop",
    emoji: "🍓",
    label: "Strawberry Pop",
    bubbleClass: "bg-gradient-to-br from-[#ff758c] to-[#ff7eb3]",
    css: "linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)",
  },
  {
    id: "electric-grape",
    emoji: "💜",
    label: "Electric Grape",
    bubbleClass: "bg-gradient-to-br from-[#a18cd1] to-[#fbc2eb]",
    css: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  },
  {
    id: "cotton-candy",
    emoji: "🍭",
    label: "Cotton Candy",
    bubbleClass: "bg-gradient-to-br from-[#89f7fe] to-[#66a6ff]",
    css: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
  },
  {
    id: "neon-lemonade",
    emoji: "🍋",
    label: "Neon Lemonade",
    bubbleClass: "bg-gradient-to-br from-[#f6d365] to-[#fda085]",
    css: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
  },
  {
    id: "mint-bubblegum",
    emoji: "🍃",
    label: "Mint Bubblegum",
    bubbleClass: "bg-gradient-to-br from-[#84fab0] to-[#8fd3f4]",
    css: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
  },
  {
    id: "peach-sunset",
    emoji: "🍑",
    label: "Peach Sunset",
    bubbleClass: "bg-gradient-to-br from-[#ff9a9e] to-[#fecfef]",
    css: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)",
  },
  {
    id: "midnight-starlight",
    emoji: "🌌",
    label: "Midnight Starlight",
    bubbleClass: "bg-gradient-to-br from-[#09203f] to-[#537895]",
    css: "linear-gradient(135deg, #09203f 0%, #537895 100%)",
    dark: true,
  },
  {
    id: "rainbow-swirl",
    emoji: "🌈",
    label: "Rainbow Swirl",
    bubbleClass: "mood-unicorn-bubble",
    css: "linear-gradient(135deg, #ff9a8b 0%, #ff6a88 55%, #ff99ac 100%)",
  },
  {
    id: "barbie-core",
    emoji: "🎀",
    label: "Barbie Core",
    bubbleClass: "bg-gradient-to-br from-[#f857a6] to-[#ff5858]",
    css: "linear-gradient(135deg, #f857a6 0%, #ff5858 100%)",
  },
  {
    id: "aqua-mermaid",
    emoji: "🫧",
    label: "Aqua Mermaid",
    bubbleClass: "bg-gradient-to-br from-[#48c6ef] to-[#6f86d6]",
    css: "linear-gradient(135deg, #48c6ef 0%, #6f86d6 100%)",
  },
];

const LEGACY_BACKDROP_IDS: Record<string, CandySwatch["id"]> = {
  "strawberry-milk": "strawberry-pop",
  "lavender-dream": "electric-grape",
  "lemon-sorbet": "neon-lemonade",
  "mint-choc": "mint-bubblegum",
  "peach-pop": "peach-sunset",
  "goth-fairy": "midnight-starlight",
  unicorn: "rainbow-swirl",
};

export const DEFAULT_BACKDROP: BackdropTheme = {
  id: "strawberry-pop",
  css: CANDY_SWATCHES[0].css,
};

export function hueToBackdrop(hue: number): BackdropTheme {
  const h = ((hue % 360) + 360) % 360;
  return {
    id: "custom-hue",
    hue: h,
    // Use hsl() (export-safe) — never oklab/oklch for room gradients
    css: `linear-gradient(135deg, hsl(${h}, 95%, 62%) 0%, hsl(${(h + 32) % 360}, 90%, 72%) 50%, hsl(${(h + 58) % 360}, 92%, 66%) 100%)`,
  };
}

export function resolveBackdropPreset(
  id?: string | null,
): CandySwatch | undefined {
  if (!id) return undefined;
  const mapped = LEGACY_BACKDROP_IDS[id] ?? id;
  return CANDY_SWATCHES.find((s) => s.id === mapped);
}

export function readBackdropTheme(): BackdropTheme {
  if (typeof window === "undefined") return DEFAULT_BACKDROP;
  try {
    const raw = localStorage.getItem(BACKDROP_STORAGE_KEY);
    if (!raw) return DEFAULT_BACKDROP;
    const parsed = JSON.parse(raw) as BackdropTheme;
    if (!parsed?.css || !parsed?.id) return DEFAULT_BACKDROP;
    const preset = resolveBackdropPreset(parsed.id);
    if (preset) {
      return {
        id: preset.id,
        css: preset.css,
        dark: preset.dark,
      };
    }
    if (parsed.id === "custom-hue") return parsed;
    return DEFAULT_BACKDROP;
  } catch {
    return DEFAULT_BACKDROP;
  }
}

export function writeBackdropTheme(theme: BackdropTheme) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BACKDROP_STORAGE_KEY, JSON.stringify(theme));
}
