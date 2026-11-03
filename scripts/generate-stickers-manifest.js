/**
 * Indexes public/stickers/** into src/data/stickersManifest.json
 * Usage: node scripts/generate-stickers-manifest.js
 */
const fs = require("fs");
const path = require("path");

const STICKERS_DIR = path.join(__dirname, "../public/stickers");
const OUTPUT_FILE = path.join(__dirname, "../src/data/stickersManifest.json");

const FOLDER_DISPLAY_NAMES = {
  charms: "Charms",
  chibi_characters: "Chibis",
  coquette: "Coquette",
  cuties: "Cuties",
  "doodles-sparkles": "Doodles",
  gems_and_ribbons: "Gems & Ribbons",
  glitter_sparkles: "Glitter",
  kawaii_animals: "Kawaii Animals",
  locks_and_keys: "Locks & Keys",
  sweets: "Sweets",
  sweet_stationery: "Stationery",
  "tape-mounts": "Tape & Mounts",
  words: "Words & Slang",
};

function titleCaseFolder(folder) {
  return folder
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function generateManifest() {
  if (!fs.existsSync(STICKERS_DIR)) {
    console.error(`Missing stickers dir: ${STICKERS_DIR}`);
    process.exit(1);
  }

  const folders = fs
    .readdirSync(STICKERS_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .sort((a, b) => a.localeCompare(b));

  const manifest = {};
  let totalItems = 0;

  folders.forEach((folder) => {
    const folderPath = path.join(STICKERS_DIR, folder);
    const files = fs
      .readdirSync(folderPath)
      .filter((f) => /\.(png|webp|jpg|jpeg)$/i.test(f))
      .filter((f) => !/^phoenix/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    totalItems += files.length;
    manifest[folder] = {
      id: folder,
      title: FOLDER_DISPLAY_NAMES[folder] || titleCaseFolder(folder),
      items: files.map((file, idx) => ({
        id: `${folder}_${String(idx + 1).padStart(3, "0")}`,
        name: file.replace(/\.[^/.]+$/, ""),
        src: `/stickers/${folder}/${file}`,
      })),
    };
  });

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2), "utf-8");
  console.log(
    `Successfully indexed ${folders.length} categories (${totalItems} stickers) → ${OUTPUT_FILE}`,
  );
}

generateManifest();
