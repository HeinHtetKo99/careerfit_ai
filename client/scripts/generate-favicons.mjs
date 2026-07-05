import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const svg = join(publicDir, 'favicon.svg');

const sizes = [
  ['favicon-32.png', 32],
  ['favicon-192.png', 192],
  ['apple-touch-icon.png', 180],
];

for (const [name, size] of sizes) {
  execFileSync(
    'npx',
    ['--yes', '@resvg/resvg-js-cli', svg, join(publicDir, name), '--fit-width', String(size), '--fit-height', String(size)],
    { stdio: 'inherit', cwd: root },
  );
}

console.log('Favicons generated in client/public/');
