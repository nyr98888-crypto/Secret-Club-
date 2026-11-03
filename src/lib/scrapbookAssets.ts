import type { PokeSoundType } from "@/utils/pokeAudio";
import type { StickerItem } from "@/constants/stickers";
import { WASHI_TAPES, type WashiPatternId } from "@/lib/washiTapes";

export type FramePreset =
  | "polaroid"
  | "pink_polaroid"
  | "film_strip"
  | "gold_mirror"
  | "doodle"
  | "stamp"
  | "whipped_cream"
  | "y2k_gel"
  | "holo_sleeve"
  /** Legacy aliases */
  | "toploader"
  | "square_washi"
  | "heart_mask"
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
  /** Procedural washi pattern id */
  washiPatternId?: WashiPatternId;
};

export const ASSET_TABS: { id: AssetCategory; label: string }[] = [
  { id: "stickers", label: "Stickers" },
  { id: "frames", label: "Frames" },
  { id: "washi", label: "Washi" },
  { id: "gems", label: "Gems" },
  { id: "pokes", label: "Pokes" },
];

/** Convert a catalog sticker into a placeable drawer asset */
export function stickerToDrawerAsset(sticker: StickerItem): DrawerAsset {
  return {
    id: sticker.id,
    category: "stickers",
    label: sticker.name,
    src: sticker.src,
    defaultWidth: 18,
    locked: sticker.isLocked,
    action: sticker.isLocked ? "open-vip" : undefined,
  };
}

/** Explicit vault CTA tile shown under sticker shelves */
export const MAGIC_CHEST_ASSET: DrawerAsset = {
  id: "pack-magic-chest",
  category: "stickers",
  label: "Unlock All 250+",
  emoji: "🎁",
  src: "",
  defaultWidth: 16,
  locked: true,
  action: "open-vip",
};

const GEM_CUTS: {
  id: string;
  label: string;
  emoji: string;
  src: string;
}[] = [
  { id: "heart-sapphire", label: "Heart Gem", emoji: "💖", src: "/gems/heart-sapphire.svg" },
  { id: "star-prism", label: "Star Prism", emoji: "⭐", src: "/gems/star-prism.svg" },
  { id: "teardrop-emerald", label: "Teardrop Emerald", emoji: "💧", src: "/gems/teardrop-emerald.svg" },
  { id: "brilliant-diamond", label: "Brilliant Diamond", emoji: "💎", src: "/gems/brilliant-diamond.svg" },
  { id: "amethyst-cushion", label: "Amethyst Cushion", emoji: "💜", src: "/gems/amethyst-cushion.svg" },
  { id: "daisy-blossom", label: "Daisy Blossom Gem", emoji: "🌸", src: "/gems/daisy-blossom.svg" },
  { id: "opal-crescent", label: "Opal Crescent Moon", emoji: "🌙", src: "/gems/opal-crescent.svg" },
  { id: "ring-pop-hex", label: "Ring Pop Hexagon", emoji: "🍬", src: "/gems/ring-pop-hex.svg" },
  { id: "ruby-ribbon-bow", label: "Ruby Ribbon Bow", emoji: "🎀", src: "/gems/ruby-ribbon-bow.svg" },
  { id: "gummy-bear", label: "Gummy Crystal Bear", emoji: "🧸", src: "/gems/gummy-bear.svg" },
  { id: "crystal-butterfly", label: "Crystal Butterfly", emoji: "🦋", src: "/gems/crystal-butterfly.svg" },
  { id: "sunburst-topaz", label: "Sunburst Topaz", emoji: "☀️", src: "/gems/sunburst-topaz.svg" },
  { id: "strawberry-ruby", label: "Strawberry Ruby", emoji: "🍓", src: "/gems/strawberry-ruby.svg" },
  { id: "disco-sphere", label: "Disco Sphere", emoji: "🪩", src: "/gems/disco-sphere.svg" },
  { id: "aqua-bubble-pearl", label: "Aqua Bubble Pearl", emoji: "🫧", src: "/gems/aqua-bubble-pearl.svg" },
  { id: "princess-marquise", label: "Princess Marquise", emoji: "👑", src: "/gems/princess-marquise.svg" },
];

/** Frames / washi / gems — stickers come from the generated catalog */
export const DEFAULT_DRAWER_ASSETS: DrawerAsset[] = [
  // —— Frames (8 photo sleeves) ——
  {
    id: "frame-polaroid",
    category: "frames",
    label: "Classic Polaroid",
    emoji: "📷",
    src: "",
    defaultWidth: 18,
    defaultRotation: 0,
    framePreset: "polaroid",
  },
  {
    id: "frame-rose-heart",
    category: "frames",
    label: "Rose Heart Polaroid",
    emoji: "💗",
    src: "",
    defaultWidth: 18,
    defaultRotation: 0,
    framePreset: "pink_polaroid",
  },
  {
    id: "frame-y2k-deco",
    category: "frames",
    label: "Y2K Translucent Deco",
    emoji: "🧁",
    src: "",
    defaultWidth: 18,
    defaultRotation: 0,
    framePreset: "whipped_cream",
  },
  {
    id: "frame-film-strip",
    category: "frames",
    label: "Retro Film Strip",
    emoji: "🎞️",
    src: "",
    defaultWidth: 17,
    defaultRotation: 0,
    framePreset: "film_strip",
  },
  {
    id: "frame-gold-foil",
    category: "frames",
    label: "Glitter Gold Foil",
    emoji: "✨",
    src: "",
    defaultWidth: 18,
    defaultRotation: 0,
    framePreset: "gold_mirror",
  },
  {
    id: "frame-stamp",
    category: "frames",
    label: "Scalloped Stamp",
    emoji: "✉️",
    src: "",
    defaultWidth: 17,
    defaultRotation: 0,
    framePreset: "stamp",
  },
  {
    id: "frame-doodle-scrap",
    category: "frames",
    label: "Doodle Scrap",
    emoji: "✏️",
    src: "",
    defaultWidth: 18,
    defaultRotation: 0,
    framePreset: "doodle",
  },
  {
    id: "frame-cyber-chrome",
    category: "frames",
    label: "Cyber Chrome Glass",
    emoji: "🪩",
    src: "",
    defaultWidth: 18,
    defaultRotation: 0,
    framePreset: "holo_sleeve",
  },

  // —— Washi (procedural) ——
  ...WASHI_TAPES.map(
    (tape, i): DrawerAsset => ({
      id: `washi-${tape.id}`,
      category: "washi",
      label: tape.label,
      emoji: tape.emoji,
      src: "",
      defaultWidth: 48,
      defaultRotation:
        [-4, 3, -6, 5, -2, 4, -3, 2, -5, 3, -1, 4][i] ?? 0,
      washiPatternId: tape.id,
    }),
  ),

  // —— Gems (16 cuts) ——
  ...GEM_CUTS.map(
    (gem, i): DrawerAsset => ({
      id: `gem-${gem.id}`,
      category: "gems",
      label: gem.label,
      emoji: gem.emoji,
      src: gem.src,
      defaultWidth: 14,
      defaultRotation: [-4, 3, -6, 5, -2, 4, -3, 2, -5, 3, -1, 4, -2, 5, -4, 1][i] ?? 0,
    }),
  ),
];

export type PlacedElementData = {
  id: string;
  assetId: string;
  category: AssetCategory;
  src: string;
  label: string;
  x: number;
  y: number;
  rotation: number;
  width: number;
  scale?: number;
  photoSrc?: string | null;
  photoOffsetX?: number;
  photoOffsetY?: number;
  framePreset?: FramePreset;
  emoji?: string;
  soundType?: PokeSoundType;
  sealColor?: string;
  /** Who sent this sound charm — shown on the badge */
  fromName?: string;
  washiPatternId?: WashiPatternId;
  /** Placed from a vault-locked tile — preview until Save/Print unlock */
  vaultPreview?: boolean;
};

export type SpawnPoint = { x: number; y: number };

/** Cap initial frame / polaroid size so dropzones stay compact (~≤280px). */
function initialWidthFor(asset: DrawerAsset): number {
  if (asset.category === "frames") {
    return Math.min(asset.defaultWidth, 20);
  }
  return asset.defaultWidth;
}

/** New placements are always upright — no random tilt */
function initialRotation(_preferred?: number): number {
  return 0;
}

export function createPlacedElement(
  asset: DrawerAsset,
  spawn?: SpawnPoint,
): PlacedElementData {
  const center: SpawnPoint = { x: 50, y: 50 };
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `el-${Date.now()}`,
    assetId: asset.id,
    category: asset.category,
    src: asset.src,
    label: asset.label,
    x: spawn?.x ?? center.x,
    y: spawn?.y ?? center.y,
    rotation: initialRotation(asset.defaultRotation),
    width: initialWidthFor(asset),
    scale: 1,
    photoSrc: asset.category === "frames" ? null : undefined,
    photoOffsetX: asset.category === "frames" ? 0 : undefined,
    photoOffsetY: asset.category === "frames" ? 0 : undefined,
    framePreset: asset.framePreset,
    emoji: asset.emoji && asset.category !== "washi" ? asset.emoji : undefined,
    washiPatternId: asset.washiPatternId,
    vaultPreview: Boolean(asset.locked || asset.action === "open-vip"),
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
  fromName?: string,
): PlacedElementData {
  const center: SpawnPoint = { x: 50, y: 50 };
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `poke-${Date.now()}`,
    assetId: `poke-${poke.id}`,
    category: "pokes",
    src: "",
    label: poke.title,
    x: spawn?.x ?? center.x,
    y: spawn?.y ?? center.y,
    rotation: 0,
    width: 26,
    scale: 1,
    emoji: poke.icon,
    soundType: poke.soundType,
    sealColor:
      poke.sealColor ||
      "linear-gradient(135deg, #f472b6 0%, #fb7185 100%)",
    fromName: fromName?.trim() || "You",
  };
}

/** @deprecated Prefer spawnOnSide from scrapbookStore for spread coords */
export const PAGE_CENTER = { x: 50, y: 50 } as const;

export function spawnNearCenter(sideBias: "left" | "right" | "center"): SpawnPoint {
  const biasX =
    sideBias === "left" ? -25 : sideBias === "right" ? 25 : 0;
  return {
    x: PAGE_CENTER.x + biasX,
    y: PAGE_CENTER.y,
  };
}
