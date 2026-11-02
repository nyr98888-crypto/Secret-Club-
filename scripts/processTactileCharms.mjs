import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC_DIR = path.join(ROOT, "public", "stickers", "y2k_cyber");
const OUT_DIR = path.join(ROOT, "public", "stickers", "tactile_charms");

fs.mkdirSync(OUT_DIR, { recursive: true });

const files = fs
  .readdirSync(SRC_DIR)
  .filter((f) => /^phoenix/i.test(f) && /\.jpe?g$/i.test(f))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

console.log("found", files.length, "charm jpgs");

function isBg(r, g, b, bg) {
  const dr = Math.abs(r - bg.r);
  const dg = Math.abs(g - bg.g);
  const db = Math.abs(b - bg.b);
  const brightness = (r + g + b) / 3;
  const nearNeutral = Math.max(r, g, b) - Math.min(r, g, b) < 28;
  const nearBg = dr + dg + db < 55;
  const veryLight = brightness > 210 && nearNeutral;
  return nearBg || veryLight;
}

async function knockOut(input, output) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const idx = (x, y) => (y * width + x) * channels;

  const samples = [
    idx(2, 2),
    idx(width - 3, 2),
    idx(2, height - 3),
    idx(width - 3, height - 3),
    idx(Math.floor(width / 2), 2),
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const i of samples) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  const bg = {
    r: r / samples.length,
    g: g / samples.length,
    b: b / samples.length,
  };

  const visited = new Uint8Array(width * height);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p]) return;
    const i = p * channels;
    if (!isBg(data[i], data[i + 1], data[i + 2], bg)) return;
    visited[p] = 1;
    stack.push(p);
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  while (stack.length) {
    const p = stack.pop();
    const x = p % width;
    const y = (p / width) | 0;
    data[p * channels + 3] = 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  for (let p = 0; p < width * height; p++) {
    const i = p * channels;
    if (data[i + 3] === 0) continue;
    const rr = data[i];
    const gg = data[i + 1];
    const bb = data[i + 2];
    const dist =
      Math.abs(rr - bg.r) + Math.abs(gg - bg.g) + Math.abs(bb - bg.b);
    if (dist < 40) {
      data[i + 3] = Math.max(0, Math.min(255, Math.round((dist / 40) * 255)));
    }
  }

  await sharp(data, { raw: { width, height, channels } }).png().toFile(output);
}

let n = 0;
for (const file of files) {
  n += 1;
  const num = String(n).padStart(3, "0");
  const out = path.join(OUT_DIR, `tactile_charms_${num}.png`);
  await knockOut(path.join(SRC_DIR, file), out);
  console.log("wrote", path.basename(out), fs.statSync(out).size);
}

console.log("done", n);
