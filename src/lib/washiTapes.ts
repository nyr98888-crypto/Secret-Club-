import type { CSSProperties } from "react";

export type WashiPatternId =
  | "strawberry-gingham"
  | "lavender-gold-stars"
  | "pastel-checkerboard"
  | "daisy-field"
  | "rainbow-sherbet"
  | "candy-stripe"
  | "lace-scallop"
  | "berry-polka"
  | "y2k-cyber-neon"
  | "gold-hologram"
  | "aqua-mermaid"
  | "peach-sunset"
  /** Legacy aliases */
  | "citrus-slices"
  | "neon-hearts"
  | "y2k-glitter"
  | "silver-sparkle";

export type WashiSwatch = {
  id: WashiPatternId;
  emoji: string;
  label: string;
  /** Inline CSS for tray preview + placed strip fill */
  style: CSSProperties;
};

/** Jagged torn-edge clip for washi strips */
export const WASHI_TORN_CLIP =
  "polygon(0% 8%, 2% 0%, 5% 10%, 8% 2%, 12% 12%, 16% 0%, 20% 9%, 24% 1%, 28% 11%, 32% 0%, 36% 10%, 40% 2%, 44% 12%, 48% 1%, 52% 9%, 56% 0%, 60% 11%, 64% 2%, 68% 10%, 72% 0%, 76% 12%, 80% 1%, 84% 9%, 88% 0%, 92% 11%, 96% 2%, 100% 8%, 100% 92%, 97% 100%, 93% 90%, 89% 100%, 85% 91%, 81% 100%, 77% 89%, 73% 100%, 69% 90%, 65% 100%, 61% 91%, 57% 100%, 53% 89%, 49% 100%, 45% 90%, 41% 100%, 37% 91%, 33% 100%, 29% 89%, 25% 100%, 21% 90%, 17% 100%, 13% 91%, 9% 100%, 5% 89%, 2% 100%, 0% 92%)";

export const WASHI_TAPES: WashiSwatch[] = [
  {
    id: "strawberry-gingham",
    emoji: "🍓",
    label: "Strawberry Gingham",
    style: {
      backgroundColor: "#fff1f2",
      backgroundImage: `
        linear-gradient(90deg, rgba(251,113,133,0.35) 1px, transparent 1px),
        linear-gradient(rgba(251,113,133,0.35) 1px, transparent 1px),
        linear-gradient(90deg, rgba(251,113,133,0.22) 50%, transparent 50%),
        linear-gradient(rgba(251,113,133,0.22) 50%, transparent 50%)
      `,
      backgroundSize: "10px 10px, 10px 10px, 20px 20px, 20px 20px",
    },
  },
  {
    id: "lavender-gold-stars",
    emoji: "💜",
    label: "Lavender Gold Stars",
    style: {
      backgroundColor: "#f3e8ff",
      backgroundImage: `
        radial-gradient(circle at 20% 40%, #fbbf24 1.2px, transparent 1.4px),
        radial-gradient(circle at 70% 25%, #f59e0b 1px, transparent 1.2px),
        radial-gradient(circle at 45% 75%, #fcd34d 1.4px, transparent 1.6px),
        radial-gradient(circle at 85% 65%, #fbbf24 1px, transparent 1.2px)
      `,
      backgroundSize: "28px 18px",
    },
  },
  {
    id: "pastel-checkerboard",
    emoji: "🏁",
    label: "Pastel Checkerboard",
    style: {
      backgroundColor: "#ecfdf5",
      backgroundImage: `
        linear-gradient(45deg, #c4b5fd 25%, transparent 25%),
        linear-gradient(-45deg, #c4b5fd 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #a7f3d0 75%),
        linear-gradient(-45deg, transparent 75%, #a7f3d0 75%)
      `,
      backgroundSize: "16px 16px",
      backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
    },
  },
  {
    id: "daisy-field",
    emoji: "🌼",
    label: "Daisy Meadow",
    style: {
      backgroundColor: "#fef9c3",
      backgroundImage: `
        radial-gradient(circle at 30% 40%, #fff 2px, transparent 2.2px),
        radial-gradient(circle at 30% 40%, #fbbf24 1px, transparent 1.2px),
        radial-gradient(circle at 70% 60%, #fff 2px, transparent 2.2px),
        radial-gradient(circle at 70% 60%, #f59e0b 1px, transparent 1.2px)
      `,
      backgroundSize: "24px 16px",
    },
  },
  {
    id: "rainbow-sherbet",
    emoji: "🌈",
    label: "Rainbow Sherbet",
    style: {
      backgroundImage:
        "linear-gradient(90deg, #fecdd3, #fde68a, #bbf7d0, #bae6fd, #e9d5ff, #fecdd3)",
      backgroundSize: "200% 100%",
    },
  },
  {
    id: "candy-stripe",
    emoji: "🍬",
    label: "Candy Cane Stripe",
    style: {
      backgroundColor: "#fff7ed",
      backgroundImage:
        "repeating-linear-gradient(-45deg, #fda4af 0 8px, #fff7ed 8px 16px)",
    },
  },
  {
    id: "lace-scallop",
    emoji: "🤍",
    label: "Scallop Lace",
    style: {
      backgroundColor: "rgba(255,255,255,0.72)",
      backgroundImage: `
        radial-gradient(circle at 8px 100%, transparent 6px, rgba(244,114,182,0.25) 6.5px, transparent 7px)
      `,
      backgroundSize: "16px 12px",
      backgroundPosition: "0 0",
      border: "1px solid rgba(244,114,182,0.25)",
    },
  },
  {
    id: "berry-polka",
    emoji: "🫐",
    label: "Berry Polka",
    style: {
      backgroundColor: "#e0f2fe",
      backgroundImage: "radial-gradient(#1e3a8a 1.8px, transparent 2px)",
      backgroundSize: "14px 14px",
    },
  },
  {
    id: "y2k-cyber-neon",
    emoji: "🖤",
    label: "Y2K Cyber Neon",
    style: {
      backgroundColor: "#0f172a",
      backgroundImage: `
        radial-gradient(circle at 28% 45%, #ff2bd6 2.2px, transparent 2.5px),
        radial-gradient(circle at 68% 55%, #7ef9ff 2px, transparent 2.3px),
        radial-gradient(circle at 50% 28%, #d6ff00 1.6px, transparent 1.9px)
      `,
      backgroundSize: "22px 16px",
    },
  },
  {
    id: "gold-hologram",
    emoji: "✨",
    label: "Gold Hologram",
    style: {
      backgroundImage:
        "linear-gradient(115deg, #fde68a, #fbbf24, #fff7ed, #d97706, #fde68a)",
      backgroundSize: "200% 100%",
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.45)",
    },
  },
  {
    id: "aqua-mermaid",
    emoji: "🫧",
    label: "Aqua Mermaid Scales",
    style: {
      backgroundColor: "#ccfbf1",
      backgroundImage: `
        radial-gradient(circle at 50% 0%, rgba(45,212,191,0.55) 0 8px, transparent 9px),
        radial-gradient(circle at 0% 100%, rgba(34,211,238,0.4) 0 8px, transparent 9px),
        radial-gradient(circle at 100% 100%, rgba(56,189,248,0.4) 0 8px, transparent 9px)
      `,
      backgroundSize: "18px 14px",
    },
  },
  {
    id: "peach-sunset",
    emoji: "🍑",
    label: "Peach Sunset",
    style: {
      backgroundImage:
        "linear-gradient(90deg, #fecdd3, #fed7aa, #fde68a, #fdba74, #fecdd3)",
      backgroundSize: "200% 100%",
    },
  },
];

const LEGACY_WASHI: Record<string, WashiPatternId> = {
  "citrus-slices": "peach-sunset",
  "neon-hearts": "y2k-cyber-neon",
  "y2k-glitter": "gold-hologram",
  "silver-sparkle": "gold-hologram",
};

export function getWashiSwatch(id?: string | null): WashiSwatch | undefined {
  if (!id) return undefined;
  const resolved = LEGACY_WASHI[id] || id;
  return WASHI_TAPES.find((w) => w.id === resolved);
}
