import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve(import.meta.dirname, '..', 'dist');
copyFileSync(`${dist}/index.html`, `${dist}/404.html`);
console.log('Copied index.html -> dist/404.html');