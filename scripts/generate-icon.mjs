import sharp from 'sharp';
import { writeFileSync } from 'fs';

const LAGOON_PATH =
  'M115 166.8 C106.7 168.1 102.6 167.0 97 165.6 C91.4 164.2 89.0 166.4 81.2 158.4 ' +
  'C73.4 150.4 58.4 129.8 50.3 117.5 C42.2 105.2 36.5 93.3 32.4 84.5 C28.3 75.7 26.8 70.7 25.5 64.5 ' +
  'C24.3 58.3 23.6 52.4 24.9 47.5 C26.2 42.6 30.0 37.9 33.2 35.4 C36.4 32.9 37.9 32.2 44 32.6 ' +
  'C50.1 33.0 59.0 30.1 70 37.6 C81.0 45.1 95.5 68.8 110 77.6 C124.5 86.4 146.9 86.5 157 90.7 ' +
  'C167.1 94.9 167.3 97.0 170.3 102.5 C173.3 108.0 175.7 116.5 174.9 123.5 C174.1 130.5 170.3 138.5 165.7 144.3 ' +
  'C161.0 150.1 155.4 154.3 147 158.1 C138.6 161.8 123.3 165.6 115 166.8 Z';

// Full 1024x1024 icon SVG (tile with orange bg + teal gradient blob)
const SIZE = 1024;
const RADIUS = Math.round(SIZE * 0.225); // rounded corners matching LagoonLogo
const BLOB_SIZE = Math.round(SIZE * 0.8); // blob is 80% of tile
const OFFSET = Math.round((SIZE - BLOB_SIZE) / 2); // center blob in tile
const SCALE = BLOB_SIZE / 200; // SVG viewBox is 200x200

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <clipPath id="tile-clip">
      <rect x="0" y="0" width="${SIZE}" height="${SIZE}" rx="${RADIUS}" ry="${RADIUS}"/>
    </clipPath>
    <clipPath id="blob-clip">
      <path transform="translate(${OFFSET},${OFFSET}) scale(${SCALE})" d="${LAGOON_PATH}"/>
    </clipPath>
    <linearGradient id="water" x1="${OFFSET + BLOB_SIZE * 0.39}" y1="${OFFSET + BLOB_SIZE * 0.13}"
                    x2="${OFFSET + BLOB_SIZE * 0.66}" y2="${OFFSET + BLOB_SIZE * 0.89}"
                    gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#1b4d5b"/>
      <stop offset="0.52" stop-color="#2c8278"/>
      <stop offset="1" stop-color="#48c6a1"/>
    </linearGradient>
  </defs>
  <!-- orange tile background -->
  <rect x="0" y="0" width="${SIZE}" height="${SIZE}" fill="#e0763c" clip-path="url(#tile-clip)"/>
  <!-- teal gradient blob -->
  <rect x="0" y="0" width="${SIZE}" height="${SIZE}" fill="url(#water)" clip-path="url(#blob-clip)"/>
</svg>`;

// Foreground-only version for adaptive icon (blob on transparent)
const fgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <clipPath id="blob-clip2">
      <path transform="translate(${OFFSET},${OFFSET}) scale(${SCALE})" d="${LAGOON_PATH}"/>
    </clipPath>
    <linearGradient id="water2" x1="${OFFSET + BLOB_SIZE * 0.39}" y1="${OFFSET + BLOB_SIZE * 0.13}"
                    x2="${OFFSET + BLOB_SIZE * 0.66}" y2="${OFFSET + BLOB_SIZE * 0.89}"
                    gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#1b4d5b"/>
      <stop offset="0.52" stop-color="#2c8278"/>
      <stop offset="1" stop-color="#48c6a1"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${SIZE}" height="${SIZE}" fill="url(#water2)" clip-path="url(#blob-clip2)"/>
</svg>`;

// Monochrome version (for Android monochrome adaptive icon)
const monoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <path transform="translate(${OFFSET},${OFFSET}) scale(${SCALE})" d="${LAGOON_PATH}" fill="#2d2a26"/>
</svg>`;

async function generate() {
  // Full icon (for iOS, favicon, expo-splash-screen image)
  await sharp(Buffer.from(iconSvg)).png().toFile('assets/images/Lagoon_icon.png');
  console.log('✓ Lagoon_icon.png (1024×1024)');

  // Foreground-only transparent PNG for Android adaptive icon foreground
  await sharp(Buffer.from(fgSvg)).png().toFile('assets/images/Lagoon_icon_fg.png');
  console.log('✓ Lagoon_icon_fg.png (foreground, transparent bg)');

  // Monochrome
  await sharp(Buffer.from(monoSvg)).png().toFile('assets/images/android-icon-monochrome.png');
  console.log('✓ android-icon-monochrome.png');

  // Favicon 48x48
  await sharp(Buffer.from(iconSvg)).resize(48, 48).png().toFile('assets/images/favicon.png');
  console.log('✓ favicon.png (48×48)');
}

generate().catch(console.error);
