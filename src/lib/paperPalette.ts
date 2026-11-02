import type { CSSProperties } from "react";

export type PaperId =
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
  /** Solid fill stored on spread.backgroundColor */
  backgroundColor: string;
  /** Optional CSS pattern key / image stored on spread.texturePattern */
  texturePattern?: string;
  backgroundImage?: string;
  backgroundSize?: string;
};

export const PAPER_PALETTE: PaperSwatch[] = [
  {
    id: "pastel-pink",
    emoji: "🌸",
    label: "Strawberry Milk",
    backgroundColor: "#fff1f2",
  },
  {
    id: "lavender-cloud",
    emoji: "💜",
    label: "Lavender Cloud",
    backgroundColor: "#faf5ff",
  },
  {
    id: "butter-yellow",
    emoji: "🍋",
    label: "Lemon Chiffon",
    backgroundColor: "#fefce8",
  },
  {
    id: "mint-green",
    emoji: "🍃",
    label: "Mint Sorbet",
    backgroundColor: "#f0fdf4",
  },
  {
    id: "baby-blue",
    emoji: "🍬",
    label: "Cotton Candy Blue",
    backgroundColor: "#f0f9ff",
  },
  {
    id: "peach-pop",
    emoji: "🍑",
    label: "Peach Cream",
    backgroundColor: "#fff7ed",
  },
  {
    id: "notebook-grid",
    emoji: "📓",
    label: "Graph Notebook",
    backgroundColor: "#fff5fb",
    texturePattern: "graph-notebook",
    backgroundImage: `
      linear-gradient(rgba(244, 114, 182, 0.18) 1px, transparent 1px),
      linear-gradient(90deg, rgba(244, 114, 182, 0.14) 1px, transparent 1px)
    `,
    backgroundSize: "10px 10px",
  },
  {
    id: "strawberry-dots",
    emoji: "🍓",
    label: "Polka Dot Paper",
    backgroundColor: "#ffffff",
    texturePattern: "polka-dots",
    backgroundImage: `radial-gradient(#fb7185 1.6px, transparent 1.7px)`,
    backgroundSize: "18px 18px",
  },
];

export const DEFAULT_PAPER_ID: PaperId = "pastel-pink";

export function getPaperSwatch(id?: string | null): PaperSwatch {
  return (
    PAPER_PALETTE.find((p) => p.id === id) ??
    PAPER_PALETTE.find((p) => p.id === DEFAULT_PAPER_ID)!
  );
}

const TEXTURE_STYLES: Record<
  string,
  Pick<CSSProperties, "backgroundImage" | "backgroundSize">
> = {
  "graph-notebook": {
    backgroundImage: `
      linear-gradient(rgba(244, 114, 182, 0.18) 1px, transparent 1px),
      linear-gradient(90deg, rgba(244, 114, 182, 0.14) 1px, transparent 1px)
    `,
    backgroundSize: "10px 10px",
  },
  "polka-dots": {
    backgroundImage: `radial-gradient(#fb7185 1.6px, transparent 1.7px)`,
    backgroundSize: "18px 18px",
  },
};

/** Inline styles for a page surface — prefers explicit color/texture fields */
export function paperStyle(opts?: {
  paperId?: string | null;
  backgroundColor?: string | null;
  texturePattern?: string | null;
} | string | null): CSSProperties {
  // Back-compat: paperStyle(paperId)
  if (typeof opts === "string" || opts == null) {
    const swatch = getPaperSwatch(opts);
    return {
      backgroundColor: swatch.backgroundColor,
      backgroundImage: swatch.backgroundImage,
      backgroundSize: swatch.backgroundSize,
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
    backgroundImage: texture?.backgroundImage,
    backgroundSize: texture?.backgroundSize,
    transition: "background-color 200ms ease, background-image 200ms ease",
  };
}
