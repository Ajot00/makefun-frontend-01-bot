// Package the static app and the captures made from it into the judge dossier.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const project = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR || '/output';
mkdirSync(out, { recursive: true });
cpSync(join(project, 'app'), join(out, 'app'), { recursive: true });
const destination = join(out, 'screenshots');
mkdirSync(destination, { recursive: true });
if (existsSync(join(project, 'screenshots'))) {
  for (const shot of JSON.parse(readFileSync(join(project, 'shots.json'), 'utf8')))
    cpSync(join(project, 'screenshots', shot.file), join(destination, shot.file));
}
writeFileSync(join(out, 'dossier.json'), buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 3, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
}));
