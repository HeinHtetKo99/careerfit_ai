import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const source = process.argv[2];

if (!source) {
  console.error('Usage: node scripts/process-logo.mjs <source-png>');
  process.exit(1);
}

execFileSync('python3', [join(root, 'scripts/remove-logo-bg.py'), source, join(publicDir, 'logo.png')], {
  stdio: 'inherit',
});
