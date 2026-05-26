import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '..', 'assets');
const files = [
  'icon.png',
  'splash-icon.png',
  'adaptive-icon.png',
  'favicon.png',
  'notification-icon.png',
];

function createAsset(width, height, r, g, b) {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (width * y + x) << 2;
      const edge = Math.min(x, y, width - x - 1, height - y - 1);
      const accent = edge < Math.floor(Math.min(width, height) * 0.08) ? 59 : r;
      png.data[idx] = accent === 59 ? 59 : r;
      png.data[idx + 1] = accent === 59 ? 130 : g;
      png.data[idx + 2] = accent === 59 ? 246 : b;
      png.data[idx + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}

fs.mkdirSync(assetsDir, { recursive: true });

for (const name of files) {
  const size = name === 'favicon.png' ? 48 : name === 'notification-icon.png' ? 96 : 1024;
  fs.writeFileSync(path.join(assetsDir, name), createAsset(size, size, 10, 10, 15));
}

console.log(`Generated ${files.length} assets in ${assetsDir}`);
