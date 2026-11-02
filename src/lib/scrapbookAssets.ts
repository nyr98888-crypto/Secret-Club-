import type { PokeSoundType } from "@/utils/pokeAudio";

export type FramePreset =
  | "polaroid"
  | "toploader"
  | "square_washi"
  | "heart_mask"
  | "stamp"
  | "gold_mirror"
  /** @deprecated legacy SVG presets — still resolved by CssPhotoFrame */
  | "classic-polaroid"
  | "deco-toploader"
  | "mini-snapshot";

export type AssetCategory =
  | "stickers"
  | "frames"
  | "washi"
  | "gems"
  | "pokes";

export type DrawerAsset = {
  id: string;
  category: AssetCategory;
  label: string;
  /** Optional image path; emoji charms may leave this empty */
  src: string;
  /** Emoji glyph used in drawer + on-canvas when no raster art */
  emoji?: string;
  /** Default width as % of page */
  defaultWidth: number;
  /** Optional starting tilt */
  defaultRotation?: number;
  /** Opens Sweet Poke picker instead of placing a sprite */
  action?: "compose-poke" | "open-vip";
  /** Locked VIP teaser tile */
  locked?: boolean;
  /** Unified photo-card frame preset */
  framePreset?: FramePreset;
};

export const ASSET_TABS: { id: AssetCategory; label: string }[] = [
  { id: "stickers", label: "Stickers" },
  { id: "frames", label: "Frames" },
  { id: "washi", label: "Washi" },
  { id: "gems", label: "Gems" },
  { id: "pokes", label: "Pokes" },
];

/** Generous free starter pack — joyful out of the box, light VIP tease */
export const DEFAULT_DRAWER_ASSETS: DrawerAsset[] = [
  // —— Stickers (8 free) ——
  {
    id: "sticker-strawberry",
    category: "stickers",
    label: "Strawberry",
    emoji: "🍓",
    src: "",
    defaultWidth: 16,
  },
  {
    id: "sticker-panda",
    category: "stickers",
    label: "Panda",
    emoji: "🐼",
    src: "",
    defaultWidth: 16,
  },
  {
    id: "sticker-ribbon",
    category: "stickers",
    label: "Ribbon",
    emoji: "🎀",
    src: "",
    defaultWidth: 16,
  },
  {
    id: "sticker-blossom",
    category: "stickers",
    label: "Blossom",
    emoji: "🌸",
    src: "",
    defaultWidth: 16,
  },
  {
    id: "sticker-cupcake",
    category: "stickers",
    label: "Cupcake",
    emoji: "🧁",
    src: "",
    defaultWidth: 16,
  },
  {
    id: "sticker-kitten",
    category: "stickers",
    label: "Kitten",
    emoji: "🐱",
    src: "",
    defaultWidth: 16,
  },
  {
    id: "sticker-daisy",
    category: "stickers",
    label: "Daisy",
    emoji: "🌼",
    src: "",
    defaultWidth: 16,
  },
  {
    id: "sticker-peace",
    category: "stickers",
    label: "Peace Sign",
    emoji: "✌️",
    src: "",
    defaultWidth: 16,
  },
  {
    id: "pack-magic-chest",
    category: "stickers",
    label: "Magic Chest",
    emoji: "🎁",
    src: "",
    defaultWidth: 16,
    locked: true,
    action: "open-vip",
  },

  // —— Frames (CSS photo shells) ——
  {
    id: "frame-polaroid",
    category: "frames",
    label: "Polaroid",
    emoji: "📷",
    src: "",
    defaultWidth: 28,
    defaultRotation: -2,
    framePreset: "polaroid",
  },
  {
    id: "frame-toploader",
    category: "frames",
    label: "Toploader",
    emoji: "💎",
    src: "",
    defaultWidth: 28,
    defaultRotation: -1,
    framePreset: "toploader",
  },
  {
    id: "frame-square-washi",
    category: "frames",
    label: "Washi Square",
    emoji: "🎀",
    src: "",
    defaultWidth: 26,
    defaultRotation: 3,
    framePreset: "square_washi",
  },
  {
    id: "frame-heart",
    category: "frames",
    label: "Heart",
    emoji: "💕",
    src: "",
    defaultWidth: 26,
    framePreset: "heart_mask",
  },
  {
    id: "frame-stamp",
    category: "frames",
    label: "Stamp",
    emoji: "✉️",
    src: "",
    defaultWidth: 26,
    defaultRotation: 2,
    framePreset: "stamp",
  },
  {
    id: "frame-gold-mirror",
    category: "frames",
    label: "Gold Mirror",
    emoji: "✨",
    src: "",
    defaultWidth: 28,
    framePreset: "gold_mirror",
  },

  // —— Washi (4 free) ——
  {
    id: "washi-grid",
    category: "washi",
    label: "Grid",
    emoji: "▦",
    src: "/washi_tape/lavender_dash.svg",
    defaultWidth: 42,
    defaultRotation: -4,
  },
  {
    id: "washi-strawberries",
    category: "washi",
    label: "Strawberries",
    emoji: "🍓",
    src: "/washi_tape/pink_dots.svg",
    defaultWidth: 42,
    defaultRotation: 3,
  },
  {
    id: "washi-hearts",
    category: "washi",
    label: "Hearts",
    emoji: "💕",
    src: "/washi_tape/pink_dots.svg",
    defaultWidth: 42,
    defaultRotation: -6,
  },
  {
    id: "washi-polka",
    category: "washi",
    label: "Polka Dots",
    emoji: "⚪",
    src: "/washi_tape/lavender_dash.svg",
    defaultWidth: 42,
    defaultRotation: 5,
  },

  // —— Gems (4 free) ——
  {
    id: "gem-heart-ruby",
    category: "gems",
    label: "Heart Ruby",
    emoji: "❤️",
    src: "/gems/crystal.svg",
    defaultWidth: 14,
  },
  {
    id: "gem-star-topaz",
    category: "gems",
    label: "Star Topaz",
    emoji: "🌟",
    src: "/gems/star_gem.svg",
    defaultWidth: 14,
  },
  {
    id: "gem-round-diamond",
    category: "gems",
    label: "Round Diamond",
    emoji: "💎",
    src: "/gems/crystal.svg",
    defaultWidth: 14,
  },
  {
    id: "gem-opal",
    category: "gems",
    label: "Opal",
    emoji: "🫧",
    src: "/gems/star_gem.svg",
    defaultWidth: 14,
  },
];

export type PlacedElementData = {
  id: string;
  assetId: string;
  category: AssetCategory;
  src: string;
  label: string;
  /** Position as % of page (0–100) */
  x: number;
  y: number;
  rotation: number;
  /** Base width as % of canvas (before scale) */
  width: number;
  /** Uniform scale factor (resize handle). Default 1; clamp 0.5–2.5 */
  scale?: number;
  /** User photo nested inside a frame asset (object URL or data URL) */
  photoSrc?: string | null;
  /** Pan offsets for Adjust Photo mode (% of aperture) */
  photoOffsetX?: number;
  photoOffsetY?: number;
  /** Which unified photo-card layout to use */
  framePreset?: FramePreset;
  /** Sticker / poke emoji glyph */
  emoji?: string;
  soundType?: PokeSoundType;
  sealColor?: string;
};

export type SpawnPoint = { x: number; y: number };

export function createPlacedElement(
  asset: DrawerAsset,
  spawn?: SpawnPoint,
): PlacedElementData {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `el-${Date.now()}`,
    assetId: asset.id,
    category: asset.category,
    src: asset.src,
    label: asset.label,
    x: spawn?.x ?? 28 + Math.random() * 30,
    y: spawn?.y ?? 28 + Math.random() * 30,
    rotation: asset.defaultRotation ?? (Math.random() * 10 - 5),
    width: asset.defaultWidth,
    scale: 1,
    photoSrc: asset.category === "frames" ? null : undefined,
    photoOffsetX: asset.category === "frames" ? 0 : undefined,
    photoOffsetY: asset.category === "frames" ? 0 : undefined,
    framePreset: asset.framePreset,
    emoji: asset.emoji,
  };
}

export function createPlacedPoke(
  poke: {
    id: string;
    icon: string;
    title: string;
    soundType: PokeSoundType;
    sealColor: string;
  },
  spawn?: SpawnPoint,
): PlacedElementData {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `poke-${Date.now()}`,
    assetId: `poke-${poke.id}`,
    category: "pokes",
    src: "",
    label: poke.title,
    x: spawn?.x ?? 28 + Math.random() * 30,
    y: spawn?.y ?? 28 + Math.random() * 30,
    rotation: Math.random() * 8 - 4,
    width: 22,
    scale: 1,
    emoji: poke.icon,
    soundType: poke.soundType,
    sealColor: poke.sealColor,
  };
}

/** @deprecated Prefer spawnOnSide from scrapbookStore for spread coords */
export const PAGE_CENTER = { x: 50, y: 48 } as const;
export const PAGE_CENTER_JITTER = { x: 8, y: 10 } as const;

export function spawnNearCenter(sideBias: "left" | "right" | "center"): SpawnPoint {
  const biasX =
    sideBias === "left" ? -6 : sideBias === "right" ? 6 : 0;
  return {
    x: PAGE_CENTER.x + biasX + (Math.random() * PAGE_CENTER_JITTER.x - PAGE_CENTER_JITTER.x / 2),
    y: PAGE_CENTER.y + (Math.random() * PAGE_CENTER_JITTER.y - PAGE_CENTER_JITTER.y / 2),
  };
}
