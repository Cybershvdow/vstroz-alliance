/* Builds the Vstroz Alliance logo as vector art and exports:
     public/brand/logo.svg          transparent mark + wordmark (crisp at any size)
     public/brand/logo-icon.svg     same art on the dark rounded tile (Discord / app icon)
     public/brand/logo.png          2048px transparent
     public/brand/logo-icon.png     1024px tile
     src/app/icon.png               512px tile (favicon / PWA)
     src/components/brand/LogoArt.tsx  inline React SVG used by the site
   Run: node scripts/build-logo.mjs
   Text is converted to outlines with Cinzel, so no font is needed at render time. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const font = opentype.loadSync(path.join(root, "scripts/fonts/Cinzel.ttf"));

const W = 1024;
const CX = 512;

/* ---------- helpers ---------- */
const n = (v) => Math.round(v * 10) / 10;

/** Leaf / feather shape from root to tip with given base width. */
function feather(rx, ry, tx, ty, w, bow = 0.55) {
  const dx = tx - rx, dy = ty - ry;
  const len = Math.hypot(dx, dy);
  const px = -dy / len, py = dx / len; // perpendicular
  const mx = rx + dx * 0.45, my = ry + dy * 0.45;
  const a = [rx + px * w * 0.5, ry + py * w * 0.5];
  const b = [rx - px * w * 0.5, ry - py * w * 0.5];
  const c1 = [mx + px * w * bow, my + py * w * bow];
  const c2 = [mx - px * w * 0.25, my - py * w * 0.25];
  return `M${n(a[0])},${n(a[1])} Q${n(c1[0])},${n(c1[1])} ${n(tx)},${n(ty)} Q${n(c2[0])},${n(c2[1])} ${n(b[0])},${n(b[1])} Z`;
}

/** Text as outline path data, centered at cx, baseline y. Per-letter scale via sizes[]. */
function textPath(str, cx, baseline, size, { letterSpacing = 0, sizeAt = () => 1 } = {}) {
  const glyphs = str.split("").map((ch, i) => ({ ch, g: font.charToGlyph(ch), s: sizeAt(i, str.length) }));
  const unitsPerEm = font.unitsPerEm;
  let total = 0;
  for (const it of glyphs) total += (it.g.advanceWidth / unitsPerEm) * size * it.s + letterSpacing;
  total -= letterSpacing;
  let x = cx - total / 2;
  let d = "";
  for (const it of glyphs) {
    const fs = size * it.s;
    d += it.g.getPath(x, baseline, fs).toPathData(1) + " ";
    x += (it.g.advanceWidth / unitsPerEm) * fs + letterSpacing;
  }
  return d.trim();
}

/* ---------- art ---------- */
const wingRoot = [462, 468];
// Broad primary feathers (tip x, tip y, base width), laid over a bat-wing membrane.
const primaries = [
  [350, 128, 118],
  [252, 176, 132],
  [172, 256, 136],
  [124, 352, 128],
  [118, 452, 116],
  [160, 540, 96],
];
const secondaries = [
  [300, 200, 100],
  [210, 300, 108],
  [160, 404, 100],
  [176, 500, 84],
];

// Scalloped membrane behind the feathers: concave curves between consecutive tips.
function membranePath(tips) {
  const [rx, ry] = wingRoot;
  let d = `M${rx},${ry} C${n(rx - 20)},${n(ry - 90)} ${n(tips[0][0] + 40)},${n(tips[0][1] + 80)} ${tips[0][0]},${tips[0][1]}`;
  for (let i = 1; i < tips.length; i++) {
    const [ax, ay] = tips[i - 1], [bx, by] = tips[i];
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    const cx = mx + (rx - mx) * 0.22, cy = my + (ry - my) * 0.22;
    d += ` Q${n(cx)},${n(cy)} ${bx},${by}`;
  }
  d += ` Q${n(rx - 120)},${n(ry + 70)} ${rx},${ry + 34} Z`;
  return d;
}
const membrane = membranePath(primaries.map(([x, y]) => [x, y]));

const leftWing = `
  <path d="${membrane}" fill="url(#wingMembrane)" stroke="#8a5a2b" stroke-width="2" stroke-linejoin="round"/>
  <g fill="url(#wingUnder)" stroke="#3a2414" stroke-width="1.5" stroke-linejoin="round">
    ${secondaries.map(([tx, ty, w]) => `<path d="${feather(wingRoot[0] + 8, wingRoot[1] + 12, tx, ty, w, 0.32)}"/>`).join("\n    ")}
  </g>
  <g fill="url(#wingBronze)" stroke="#1a100a" stroke-width="2" stroke-linejoin="round">
    ${primaries.map(([tx, ty, w]) => `<path d="${feather(wingRoot[0], wingRoot[1], tx, ty, w, 0.38)}"/>`).join("\n    ")}
  </g>
  <g stroke="url(#wingEdge)" stroke-width="2" fill="none" opacity="0.8" stroke-linecap="round">
    ${primaries.map(([tx, ty]) => `<path d="M${wingRoot[0]},${wingRoot[1]} Q${n((wingRoot[0] + tx) / 2 - 24)},${n((wingRoot[1] + ty) / 2 - 24)} ${n(tx + (wingRoot[0] - tx) * 0.04)},${n(ty + (wingRoot[1] - ty) * 0.04)}"/>`).join("\n    ")}
  </g>
  <!-- ember light catching the inner wing -->
  <path d="${feather(wingRoot[0], wingRoot[1], 350, 128, 118, 0.38)}" fill="url(#emberGlow)" opacity="0.45"/>
  <path d="${feather(wingRoot[0], wingRoot[1], 252, 176, 132, 0.38)}" fill="url(#emberGlow)" opacity="0.2"/>`;

const crest = `
  <!-- warm aura behind the crest -->
  <circle cx="512" cy="380" r="190" fill="url(#emberGlow)" opacity="0.55" filter="url(#glowWide)"/>
  <!-- horns -->
  <path d="M512,310 C468,262 426,226 372,96 C382,200 440,250 512,310 Z" fill="url(#steel)" stroke="#5a4a3a" stroke-width="2"/>
  <path d="M512,310 C556,262 598,226 652,96 C642,200 584,250 512,310 Z" fill="url(#steel)" stroke="#5a4a3a" stroke-width="2"/>
  <!-- crossguard -->
  <path d="M430,318 L594,318 L580,342 L444,342 Z" fill="url(#steelDark)" stroke="#6b5a48" stroke-width="2"/>
  <!-- central spire -->
  <path d="M512,70 L544,240 L540,480 L512,540 L484,480 L480,240 Z" fill="url(#steel)" stroke="#6b5a48" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M512,70 L512,540" stroke="#d9c7a8" stroke-width="2" opacity="0.6"/>
  <!-- eyes -->
  <g filter="url(#glowSmall)">
    <path d="M462,262 L490,270 L470,282 Z" fill="#ffd166"/>
    <path d="M562,262 L534,270 L554,282 Z" fill="#ffd166"/>
  </g>
  <!-- ember core -->
  <circle cx="512" cy="372" r="90" fill="url(#emberGlow)" filter="url(#glow)"/>
  <circle cx="512" cy="372" r="26" fill="url(#emberCore)"/>
  <circle cx="512" cy="366" r="10" fill="#fff1c9"/>`;

const wordmark = textPath("VSTROZ", CX, 748, 122, { letterSpacing: 4, sizeAt: (i, len) => (i === 0 || i === len - 1 ? 1.34 : 1) });
const sub = textPath("ALLIANCE", CX, 804, 36, { letterSpacing: 13 });

const text = `
  <g filter="url(#textShadow)">
    <path d="${wordmark}" fill="url(#silver)" stroke="#d6d6d6" stroke-width="3" paint-order="stroke" stroke-linejoin="round"/>
  </g>
  <path d="${sub}" fill="url(#gold)" stroke="#f2c14e" stroke-width="0.8" paint-order="stroke"/>
  <!-- flourishes -->
  <path d="M300,796 Q360,780 400,796" stroke="url(#gold)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M724,796 Q664,780 624,796" stroke="url(#gold)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- lower ember + spike -->
  <circle cx="512" cy="846" r="34" fill="url(#emberGlow)" filter="url(#glow)"/>
  <circle cx="512" cy="846" r="9" fill="url(#emberCore)"/>
  <path d="M512,866 L530,904 L512,990 L494,904 Z" fill="url(#steelDark)" stroke="#6b5a48" stroke-width="2"/>`;

const defs = `
  <defs>
    <linearGradient id="wingBronze" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8a5a2f"/>
      <stop offset="0.45" stop-color="#4a2e18"/>
      <stop offset="1" stop-color="#1a1009"/>
    </linearGradient>
    <linearGradient id="wingUnder" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4a2e18"/>
      <stop offset="1" stop-color="#120b07"/>
    </linearGradient>
    <linearGradient id="wingMembrane" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a2212"/>
      <stop offset="1" stop-color="#0c0806"/>
    </linearGradient>
    <linearGradient id="wingEdge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e0a45c"/>
      <stop offset="1" stop-color="#5a3a1e"/>
    </linearGradient>
    <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#3a3037"/>
      <stop offset="0.5" stop-color="#9a8f8a"/>
      <stop offset="1" stop-color="#2b2226"/>
    </linearGradient>
    <linearGradient id="steelDark" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#241c1f"/>
      <stop offset="0.5" stop-color="#6d615d"/>
      <stop offset="1" stop-color="#1b1417"/>
    </linearGradient>
    <radialGradient id="emberGlow">
      <stop offset="0" stop-color="#ff9a3c" stop-opacity="0.95"/>
      <stop offset="0.5" stop-color="#ff5a1f" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#ff5a1f" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="emberCore">
      <stop offset="0" stop-color="#ffe9b0"/>
      <stop offset="0.6" stop-color="#ff8a2a"/>
      <stop offset="1" stop-color="#c8380c"/>
    </radialGradient>
    <linearGradient id="silver" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.45" stop-color="#dcdcdc"/>
      <stop offset="0.5" stop-color="#9c9c9c"/>
      <stop offset="1" stop-color="#e8e8e8"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe08a"/>
      <stop offset="1" stop-color="#b98a1e"/>
    </linearGradient>
    <radialGradient id="tile" cx="0.5" cy="0.42" r="0.7">
      <stop offset="0" stop-color="#231611"/>
      <stop offset="0.6" stop-color="#0e0b0c"/>
      <stop offset="1" stop-color="#060506"/>
    </radialGradient>
    <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
    <filter id="glowWide" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="60"/>
    </filter>
    <filter id="glowSmall" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="3"/>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="textShadow" x="-10%" y="-30%" width="120%" height="170%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity="0.8"/>
    </filter>
  </defs>`;

const CREST_BOX = "90 50 844 520";
const WORD_BOX = "190 600 644 236";

function body({ tile, withCrest = true, withText = true }) {
  return `${defs}
  ${tile ? `<rect width="${W}" height="${W}" rx="200" fill="url(#tile)"/>
  <circle cx="512" cy="420" r="330" fill="url(#emberGlow)" opacity="0.28" filter="url(#glowWide)"/>` : ""}
  ${withCrest ? `<g>${leftWing}</g>
  <g transform="translate(${W},0) scale(-1,1)">${leftWing}</g>
  ${crest}` : ""}
  ${withText ? text : ""}`;
}

function svg(opts, viewBox = `0 0 ${W} ${W}`) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="Vstroz Alliance">
${body(opts)}
</svg>`;
}

const out = (p) => path.join(root, p);
fs.mkdirSync(out("public/brand"), { recursive: true });

const mark = svg({ tile: false });
const icon = svg({ tile: true });
fs.writeFileSync(out("public/brand/logo.svg"), mark);
fs.writeFileSync(out("public/brand/logo-icon.svg"), icon);

await sharp(Buffer.from(mark)).resize(2048, 2048).png().toFile(out("public/brand/logo.png"));
await sharp(Buffer.from(icon)).resize(1024, 1024).png().toFile(out("public/brand/logo-icon.png"));
await sharp(Buffer.from(icon)).resize(512, 512).png().toFile(out("src/app/icon.png"));

fs.writeFileSync(out("public/brand/logo-crest.svg"), svg({ tile: false, withText: false }, CREST_BOX));
fs.writeFileSync(out("public/brand/logo-wordmark.svg"), svg({ tile: false, withCrest: false }, WORD_BOX));

// Inline React components so the site renders the art without extra requests.
// Gradient/filter ids are prefixed per component to avoid collisions when several appear on one page.
function component(name, opts, viewBox, prefix) {
  const inner = body(opts).replace(/id="([a-zA-Z]+)"/g, `id="${prefix}-$1"`).replace(/url\(#([a-zA-Z]+)\)/g, `url(#${prefix}-$1)`);
  return `export function ${name}({ className = "", title = "Vstroz Alliance" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="${viewBox}" className={className} role="img" aria-label={title} dangerouslySetInnerHTML={{ __html: ${JSON.stringify(inner)} }} />
  );
}
`;
}
const tsx = `/* GENERATED by scripts/build-logo.mjs — do not edit by hand. */
${component("LogoArt", { tile: false }, `0 0 ${W} ${W}`, "la")}
${component("LogoCrest", { tile: false, withText: false }, CREST_BOX, "lc")}
${component("LogoWordmark", { tile: false, withCrest: false }, WORD_BOX, "lw")}`;
fs.writeFileSync(out("src/components/brand/LogoArt.tsx"), tsx);

console.log("Logo built: public/brand/logo.svg, logo-icon.svg, logo.png, logo-icon.png, src/app/icon.png, LogoArt.tsx");
