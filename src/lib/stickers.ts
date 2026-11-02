export const DROP_STICKERS = [
  "💖",
  "✨",
  "🍓",
  "🎀",
  "🦄",
  "⚡",
  "🕶️",
  "🍕",
  "💀",
  "🔥",
  "🏆",
  "🎮",
] as const;

export type DropSticker = (typeof DROP_STICKERS)[number];
