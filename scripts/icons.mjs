/* global console */
import sharp from 'sharp';

const source = 'public/favicon.svg';
const targets = [
  ['public/apple-touch-icon.png', 180],
  ['public/icon-192.png', 192],
  ['public/icon-512.png', 512],
];

for (const [path, size] of targets) {
  await sharp(source).resize(size, size).png().toFile(path);
  console.log(`${path} ${size}px`);
}
