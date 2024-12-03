// @ts-check
import { defineConfig } from '@rsbuild/core';
import { glob } from 'fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const testProjects = await Array.fromAsync(
  glob(path.join(__dirname, 'src', '*', 'index.ts')),
);

const port = parseFloat(process.env.PORT ?? '3080');
export default defineConfig({
  source: {
    entry: Object.fromEntries(
      testProjects.map(e => [path.basename(path.dirname(e)), e]),
    ),
  },
  mode: 'development',
  server: {
    port,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': ' require-corp',
    },
  },
});
