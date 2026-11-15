// Lightboard packages its browser app and the views captured from live public data.
// Paths are anchored here so the harness can run this file from any working directory.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const source = fileURLToPath(new URL('.', import.meta.url));
const destination = process.env.MAKEFUN_OUTPUT_DIR || '/output';
mkdirSync(destination, { recursive: true });
cpSync(join(source, 'app'), join(destination, 'app'), { recursive: true });
mkdirSync(join(destination, 'screenshots'), { recursive: true });
if (existsSync(join(source, 'screenshots'))) {
  cpSync(join(source, 'screenshots'), join(destination, 'screenshots'), { recursive: true });
}

// My favorite part of a bounty board is the moment the live pot makes the work feel real.
const dossier = buildDossier(destination, {
  text_max_bytes: 163840,
  screenshots: { max: 3, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(destination, 'dossier.json'), dossier);
