import type { CSSProperties } from "react";

export type PaperId =
  | "clean-cream"
  | "pink-grid"
  | "dot-journal"
  | "pastel-lined"
  | "cherry-blossom"
  | "cloud-blue"
  | "lemon-sherbet"
  | "cyber-black"
  | "strawberry-gingham"
  | "cotton-candy"
  | "kraft-cardboard"
  | "holographic-starlight"
  /** Legacy ids kept so saved scrapbooks still resolve */
  | "pastel-pink"
  | "lavender-cloud"
  | "butter-yellow"
  | "mint-green"
  | "baby-blue"
  | "peach-pop"
  | "notebook-grid"
  | "strawberry-dots";

export type PaperSwatch = {
  id: PaperId;
  emoji: string;
  label: string;
  backgroundColor: string;
  texturePattern?: string;
  backgroundImage?: string;
  backgroundSize?: string;
};

export const PAPER_PALETTE: PaperSwatch[] = [
  {
    id: "clean-cream",
    emoji: "📄",
    label: "Warm Cream Craft Paper",
    backgroundColor: "#faf6ef",
  },
  {
    id: "pink-grid",
    emoji: "📏",
    label: "Pastel Pink Grid",
    backgroundColor: "#fff5fb",
    texturePattern: "pink-grid",
    backgroundImage: `
      linear-gradient(rgba(244, 114, 182, 0.2) 1px, transparent 1px),
      linear-gradient(90deg, rgba(244, 114, 182, 0.16) 1px, transparent 1px)
    `,
    backgroundSize: "12px 12px",
  },
  {
    id: "dot-journal",
    emoji: "🟣",
    label: "Lavender Bullet Journal Dots",
    backgroundColor: "#faf5ff",
    texturePattern: "lavender-dots",
    backgroundImage: `radial-gradient(rgba(167, 139, 250, 0.55) 1.4px, transparent 1.5px)`,
    backgroundSize: "16px 16px",
  },
  {
    id: "pastel-lined",
    emoji: "📝",
    label: "Mint Notebook Lines",
    backgroundColor: "#f0fdf4",
    texturePattern: "mint-lines",
    backgroundImage: `repeating-linear-gradient(
      transparent 0 22px,
      rgba(52, 211, 153, 0.28) 22px 23px
    )`,
    backgroundSize: "100% 23px",
  },
  {
    id: "cherry-blossom",
    emoji: "🌸",
    label: "Cherry Blossom Watermark",
    backgroundColor: "#fff1f2",
    texturePattern: "cherry-blossom",
    backgroundImage: `
      radial-gradient(circle at 18% 28%, rgba(251, 113, 133, 0.12) 0 10px, transparent 11px),
      radial-gradient(circle at 72% 62%, rgba(244, 114, 182, 0.1) 0 14px, transparent 15px),
      radial-gradient(circle at 48% 78%, rgba(253, 164, 175, 0.12) 0 8px, transparent 9px),
      radial-gradient(circle at 84% 22%, rgba(251, 207, 232, 0.2) 0 12px, transparent 13px)
    `,
    backgroundSize: "100% 100%",
  },
  {
    id: "cloud-blue",
    emoji: "☁️",
    label: "Soft Cloud Blue",
    backgroundColor: "#eff6ff",
    texturePattern: "cloud-blue",
    backgroundImage: `
      radial-gradient(ellipse at 22% 30%, rgba(255,255,255,0.95) 0 18px, transparent 19px),
      radial-gradient(ellipse at 30% 34%, rgba(255,255,255,0.85) 0 14px, transparent 15px),
      radial-gradient(ellipse at 68% 55%, rgba(255,255,255,0.9) 0 20px, transparent 21px),
      radial-gradient(ellipse at 78% 52%, rgba(255,255,255,0.8) 0 12px, transparent 13px)
    `,
    backgroundSize: "100% 100%",
  },
  {
    id: "lemon-sherbet",
    emoji: "💛",
    label: "Lemon Sherbet Textured Paper",
    backgroundColor: "#fefce8",
    texturePattern: "lemon-sherbet",
    backgroundImage: `
      repeating-linear-gradient(
        -18deg,
        rgba(250, 204, 21, 0.12) 0 6px,
        transparent 6px 14px
      )
    `,
    backgroundSize: "100% 100%",
  },
  {
    id: "cyber-black",
    emoji: "🖤",
    label: "Y2K Cyber Black Sheet",
    backgroundColor: "#0f172a",
    texturePattern: "cyber-black",
    backgroundImage: `
      linear-gradient(rgba(34,211,238,0.12) 1px, transparent 1px),
      linear-gradient(90deg, rgba(244,114,182,0.1) 1px, transparent 1px)
    `,
    backgroundSize: "18px 18px",
  },
  {
    id: "strawberry-gingham",
    emoji: "🍓",
    label: "Strawberry Picnic Gingham",
    backgroundColor: "#fff1f2",
    texturePattern: "strawberry-gingham",
    backgroundImage: `
      linear-gradient(90deg, rgba(251,113,133,0.28) 1px, transparent 1px),
      linear-gradient(rgba(251,113,133,0.28) 1px, transparent 1px),
      linear-gradient(90deg, rgba(251,113,133,0.16) 50%, transparent 50%),
      linear-gradient(rgba(251,113,133,0.16) 50%, transparent 50%)
    `,
    backgroundSize: "14px 14px, 14px 14px, 28px 28px, 28px 28px",
  },
  {
    id: "cotton-candy",
    emoji: "🍬",
    label: "Cotton Candy Swirl Paper",
    backgroundColor: "#fdf2f8",
    texturePattern: "cotton-candy",
    backgroundImage: `
      radial-gradient(circle at 20% 30%, rgba(244,114,182,0.22) 0 40px, transparent 41px),
      radial-gradient(circle at 70% 25%, rgba(167,139,250,0.2) 0 50px, transparent 51px),
      radial-gradient(circle at 55% 75%, rgba(125,211,252,0.2) 0 45px, transparent 46px)
    `,
    backgroundSize: "100% 100%",
  },
  {
    id: "kraft-cardboard",
    emoji: "🧸",
    label: "Kraft Cardboard Paper",
    backgroundColor: "#e7d3b0",
    texturePattern: "kraft-cardboard",
    backgroundImage: `
      repeating-linear-gradient(
        0deg,
        rgba(120, 80, 40, 0.06) 0 2px,
        transparent 2px 5px
      )
    `,
    backgroundSize: "100% 100%",
  },
  {
    id: "holographic-starlight",
    emoji: "✨",
    label: "Holographic Starlight Paper",
    backgroundColor: "#faf5ff",
    texturePattern: "holographic-starlight",
    backgroundImage: `
      radial-gradient(circle at 15% 20%, rgba(255,255,255,0.95) 0 1.5px, transparent 2px),
      radial-gradient(circle at 55% 35%, rgba(167,139,250,0.55) 0 1.2px, transparent 1.5px),
      radial-gradient(circle at 80% 60%, rgba(244,114,182,0.5) 0 1.4px, transparent 1.7px),
      radial-gradient(circle at 30% 75%, rgba(34,211,238,0.45) 0 1.2px, transparent 1.5px),
      linear-gradient(135deg, rgba(244,114,182,0.08), rgba(125,211,252,0.1), rgba(167,139,250,0.08))
    `,
    backgroundSize: "48px 48px, 36px 36px, 42px 42px, 30px 30px, 100% 100%",
  },
];

export const DEFAULT_PAPER_ID: PaperId = "clean-cream";

const LEGACY_PAPER: Record<string, PaperId> = {
  "pastel-pink": "cherry-blossom",
  "lavender-cloud": "dot-journal",
  "butter-yellow": "lemon-sherbet",
  "mint-green": "pastel-lined",
  "baby-blue": "cloud-blue",
  "peach-pop": "clean-cream",
  "notebook-grid": "pink-grid",
  "strawberry-dots": "strawberry-gingham",
};

export function getPaperSwatch(id?: string | null): PaperSwatch {
  const resolved = (id && LEGACY_PAPER[id]) || id;
  return (
    PAPER_PALETTE.find((p) => p.id === resolved) ??
    PAPER_PALETTE.find((p) => p.id === DEFAULT_PAPER_ID)!
  );
}

const TEXTURE_STYLES: Record<
  string,
  Pick<CSSProperties, "backgroundImage" | "backgroundSize">
> = Object.fromEntries(
  PAPER_PALETTE.filter((p) => p.texturePattern && p.backgroundImage).map(
    (p) => [
      p.texturePattern!,
      {
        backgroundImage: p.backgroundImage,
        backgroundSize: p.backgroundSize,
      },
    ],
  ),
);

/**
 * Inline styles for a page surface.
 * Uses only longhands (backgroundColor / backgroundImage) — never the
 * `background` shorthand — to avoid React conflicting-property warnings.
 */
export function paperStyle(opts?: {
  paperId?: string | null;
  backgroundColor?: string | null;
  texturePattern?: string | null;
} | string | null): CSSProperties {
  if (typeof opts === "string" || opts == null) {
    const swatch = getPaperSwatch(opts);
    return {
      backgroundColor: swatch.backgroundColor,
      backgroundImage: swatch.backgroundImage ?? "none",
      backgroundSize: swatch.backgroundSize ?? "auto",
      backgroundRepeat: swatch.backgroundImage ? "repeat" : "no-repeat",
      transition: "background-color 200ms ease, background-image 200ms ease",
    };
  }

  const swatch = getPaperSwatch(opts.paperId);
  const texture =
    (opts.texturePattern && TEXTURE_STYLES[opts.texturePattern]) ||
    (swatch.backgroundImage
      ? {
          backgroundImage: swatch.backgroundImage,
          backgroundSize: swatch.backgroundSize,
        }
      : undefined);

  return {
    backgroundColor: opts.backgroundColor || swatch.backgroundColor || "#ffffff",
    backgroundImage: texture?.backgroundImage ?? "none",
    backgroundSize: texture?.backgroundSize ?? "auto",
    backgroundRepeat: texture?.backgroundImage ? "repeat" : "no-repeat",
    transition: "background-color 200ms ease, background-image 200ms ease",
  };
}
