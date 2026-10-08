/* Import the official logo artwork (black background) into the site's brand assets.
   Usage: node scripts/import-logo.mjs <path-to-image>
   Outputs (public/brand/):
     logo-raven-1024.png     full logo, square, edges faded to transparent so it floats on dark backgrounds
     logo-raven-512.png      512px version of the same
     logo-hero.png           1600px version for the home hero
     logo-tile-1024.png      full logo on solid black (Discord icon / avatars)
     src/app/icon.png        512px tile (favicon / link previews) */

import sharp from "sharp";

const src = process.argv[2];
if (!src) { console.error("usage: node scripts/import-logo.mjs <image>"); process.exit(1); }

const img = sharp(src).png();
const { data, info } = await img.clone().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

// Bounding box of non-black content
let minX = W, minY = H, maxX = 0, maxY = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * C;
  if (data[i] + data[i + 1] + data[i + 2] > 60) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
}
const bw = maxX - minX + 1, bh = maxY - minY + 1;
const side = Math.round(Math.max(bw, bh) * 1.16); // 8% padding each side
const cx = Math.round((minX + maxX) / 2), cy = Math.round((minY + maxY) / 2);
const left = Math.max(0, cx - Math.floor(side / 2)), top = Math.max(0, cy - Math.floor(side / 2));
const extract = { left, top, width: Math.min(side, W - left), height: Math.min(side, H - top) };
console.log(`content bbox ${minX},${minY} → ${maxX},${maxY}; tile ${extract.width}x${extract.height}`);

const squareBlack = async (size) =>
  sharp(src).extract(extract).resize(size, size, { fit: "contain", background: "#000000" }).png();

// Alpha mask: opaque inside, fading to transparent across the outer 9% (rounded) so black edges disappear
const fadeMask = (size) => {
  const r = Math.round(size * 0.09);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <defs><filter id="b"><feGaussianBlur stdDeviation="${Math.round(size * 0.035)}"/></filter></defs>
    <rect x="${r}" y="${r}" width="${size - 2 * r}" height="${size - 2 * r}" rx="${Math.round(size * 0.12)}" fill="#fff" filter="url(#b)"/>
  </svg>`);
};

const faded = async (size, out) => {
  const base = await (await squareBlack(size)).toBuffer();
  await sharp(base).ensureAlpha().composite([{ input: fadeMask(size), blend: "dest-in" }]).png().toFile(out);
};

await faded(1024, "public/brand/logo-raven-1024.png");
await faded(512, "public/brand/logo-raven-512.png");
await faded(1600, "public/brand/logo-hero.png");
await (await squareBlack(1024)).toFile("public/brand/logo-tile-1024.png");
await (await squareBlack(512)).toFile("src/app/icon.png");
console.log("brand assets written");
