/**
 * Scans public/stickers/** and writes src/constants/stickers.ts
 * One UI tab per folder (13 curated packs).
 * Usage: node scripts/generateStickerCatalog.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const STICKERS_DIR = path.join(ROOT, "public", "stickers");
const OUT_FILE = path.join(ROOT, "src", "constants", "stickers.ts");

const IMAGE_EXT = new Set([".png", ".webp", ".jpg", ".jpeg"]);

/** Folder id → display tab (1:1 with curated packs) */
const FOLDER_META = {
  charms: { tabId: "charms", label: "Charms", icon: "🔮", itemLabel: "Charm" },
  chibi_characters: {
    tabId: "chibis",
    label: "Chibis",
    icon: "👧",
    itemLabel: "Chibi",
    premium: true,
  },
  coquette: {
    tabId: "coquette",
    label: "Coquette",
    icon: "🩰",
    itemLabel: "Coquette",
    premium: true,
  },
  cuties: { tabId: "cuties", label: "Cuties", icon: "🧸", itemLabel: "Cutie" },
  "doodles-sparkles": {
    tabId: "doodles",
    label: "Doodles",
    icon: "🌟",
    itemLabel: "Doodle",
  },
  gems_and_ribbons: {
    tabId: "gems-ribbons",
    label: "Gems & Ribbons",
    icon: "🎀",
    itemLabel: "Gem",
  },
  glitter_sparkles: {
    tabId: "glitter",
    label: "Glitter",
    icon: "✨",
    itemLabel: "Glitter",
  },
  kawaii_animals: {
    tabId: "animals",
    label: "Animals",
    icon: "🐾",
    itemLabel: "Animal",
  },
  locks_and_keys: {
    tabId: "locks",
    label: "Locks",
    icon: "🗝️",
    itemLabel: "Lock",
    premium: true,
  },
  sweets: { tabId: "sweets", label: "Sweets", icon: "🧁", itemLabel: "Sweet" },
  sweet_stationery: {
    tabId: "stationery",
    label: "Stationery",
    icon: "✏️",
    itemLabel: "Stationery",
  },
  "tape-mounts": {
    tabId: "tape",
    label: "Tape & Mounts",
    icon: "📎",
    itemLabel: "Tape",
  },
  words: { tabId: "words", label: "Words", icon: "💬", itemLabel: "Word" },
};

function stickerName(folder, file, itemLabel) {
  const base = file.replace(/\.[^.]+$/, "");
  const numMatch = base.match(/(\d+)\s*$/);
  const num = numMatch ? numMatch[1].padStart(3, "0") : null;
  if (num) return `${itemLabel} ${num}`;
  const cleaned = base
    .replace(new RegExp(`^${folder.replace(/[-_]/g, "[-_]")}_`, "i"), "")
    .replace(/_?new_?/gi, " ")
    .replace(/[_-]+/g, " ")
    .trim();
  return (
    cleaned
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") || itemLabel
  );
}

function walkImages(folder) {
  const abs = path.join(STICKERS_DIR, folder);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) return [];
  return fs
    .readdirSync(abs, { withFileTypes: true })
    .filter((d) => {
      if (!d.isFile()) return false;
      const ext = path.extname(d.name).toLowerCase();
      if (!IMAGE_EXT.has(ext)) return false;
      if (/^phoenix/i.test(d.name)) return false;
      const full = path.join(abs, d.name);
      try {
        const st = fs.statSync(full);
        return st.isFile() && st.size > 0;
      } catch {
        return false;
      }
    })
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function main() {
  if (!fs.existsSync(STICKERS_DIR)) {
    console.error("Missing public/stickers — aborting.");
    process.exit(1);
  }

  const folders = fs
    .readdirSync(STICKERS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b));

  const tabs = [];
  const tabSeen = new Set();
  const items = [];

  for (const folder of folders) {
    const meta = FOLDER_META[folder] || {
      tabId: folder.replace(/[^a-z0-9]+/gi, "-").toLowerCase(),
      label: folder.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      icon: "✨",
      itemLabel: "Sticker",
    };

    if (!tabSeen.has(meta.tabId)) {
      tabSeen.add(meta.tabId);
      tabs.push({
        id: meta.tabId,
        label: meta.label,
        icon: meta.icon,
        folder,
        isPremium: Boolean(meta.premium),
      });
    }

    for (const file of walkImages(folder)) {
      const stem = file.replace(/\.[^.]+$/, "");
      const id = `sticker-${folder}-${stem}`.replace(/[^\w-]+/g, "-");
      items.push({
        id,
        src: `/stickers/${folder}/${file}`,
        category: folder,
        tabId: meta.tabId,
        name: stickerName(folder, file, meta.itemLabel),
        isLocked: Boolean(meta.premium) || undefined,
      });
    }
  }

  // Stable UI order matching curated pack list
  const ORDER = [
    "animals",
    "glitter",
    "gems-ribbons",
    "sweets",
    "stationery",
    "locks",
    "tape",
    "words",
    "charms",
    "coquette",
    "chibis",
    "cuties",
    "doodles",
  ];
  tabs.sort((a, b) => {
    const ai = ORDER.indexOf(a.id);
    const bi = ORDER.indexOf(b.id);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const body = `/* AUTO-GENERATED by scripts/generateStickerCatalog.mjs — do not edit by hand */
/* ${items.length} stickers across ${folders.length} folders */

export interface StickerItem {
  id: string;
  src: string;
  /** Source folder under public/stickers/ */
  category: string;
  /** Display-tab id (friendly UI group) */
  tabId: string;
  name: string;
  /** Reserved for Magic Box gating */
  isLocked?: boolean;
}

export type StickerTabId =
${tabs.map((t) => `  | "${t.id}"`).join("\n")};

export const STICKER_TABS: {
  id: StickerTabId;
  label: string;
  icon: string;
  folder: string;
  isPremium?: boolean;
}[] = ${JSON.stringify(tabs, null, 2)};

export const STICKERS: StickerItem[] = ${JSON.stringify(
    items.map((i) => {
      const out = { ...i };
      if (!out.isLocked) delete out.isLocked;
      return out;
    }),
    null,
    2,
  )};

export const STICKER_COUNT = ${items.length} as const;

export function stickersForTab(tabId: StickerTabId | string): StickerItem[] {
  return STICKERS.filter((s) => s.tabId === tabId);
}

export function stickersForFolder(folder: string): StickerItem[] {
  return STICKERS.filter((s) => s.category === folder);
}
`;

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, body, "utf8");

  console.log(`Wrote ${items.length} stickers → ${path.relative(ROOT, OUT_FILE)}`);
  for (const t of tabs) {
    const n = items.filter((i) => i.tabId === t.id).length;
    console.log(`  ${t.icon} ${t.label} (${t.id}): ${n}${t.isPremium ? " [premium]" : ""}`);
  }
}

main();
