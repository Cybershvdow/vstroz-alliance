/* Replace the second letter (Z) of the wordmark in public/brand/logo-original-1024.png with an S,
   producing public/brand/logo-vstroz-1024.png. Tunable box + font size via args: node scripts/fix-logo-s.mjs x y w h size yOffset */
import fs from "node:fs";
import sharp from "sharp";
import opentype from "opentype.js";

const [x = 262, y = 560, w = 40, h = 84, size = 104, dy = 0] = process.argv.slice(2).map(Number);
const src = "public/brand/logo-original-1024.png";
const font = opentype.loadSync("scripts/fonts/Cinzel.ttf");

// sample background colour just left/right of the box
const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
const px = (X, Y) => { const i = (Y * info.width + X) * info.channels; return [data[i], data[i + 1], data[i + 2]]; };
let acc = [0, 0, 0], n = 0;
for (let Y = y; Y < y + h; Y += 4) for (const X of [x - 6, x - 3, x + w + 3, x + w + 6]) { const p = px(X, Y); acc = [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]]; n++; }
const bg = acc.map(v => Math.round(v / n));
const bgHex = "#" + bg.map(v => v.toString(16).padStart(2, "0")).join("");

// S outline from Cinzel, centred in the box, baseline at bottom of box
const glyph = font.charToGlyph("S");
const adv = (glyph.advanceWidth / font.unitsPerEm) * size;
const gx = x + (w - adv) / 2;
const path = glyph.getPath(gx, y + h + dy, size).toPathData(2);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${info.width}" height="${info.height}">
  <defs>
    <linearGradient id="silver" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="0.45" stop-color="#d9d9d9"/><stop offset="0.5" stop-color="#9a9a9a"/><stop offset="1" stop-color="#e6e6e6"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4.2"/></filter>
    <filter id="patch" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="11"/></filter>
  </defs>
  <rect x="${x + 2}" y="${y - 2}" width="${w - 4}" height="${h + 6}" rx="10" fill="#120f0d" filter="url(#patch)"/>
  <g filter="url(#soft)">
    <path d="${path}" fill="#1a1512" stroke="#1a1512" stroke-width="14" stroke-linejoin="round"/>
    <path d="${path}" fill="url(#silver)" stroke="url(#silver)" stroke-width="7" stroke-linejoin="round" paint-order="stroke"/>
  </g>
</svg>`;

await sharp(src).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png().toFile("public/brand/logo-vstroz-1024.png");
await sharp("public/brand/logo-vstroz-1024.png").extract({ left: 150, top: 530, width: 760, height: 150 }).resize(1520, 300, { kernel: "lanczos3" }).png().toFile(process.env.TEMP + "/wordmark-after.png");
console.log(`done: box x=${x} y=${y} w=${w} h=${h} size=${size} dy=${dy} bg=${bgHex}`);
