// Assemble the static Lightboard app and its three live captures for the kit.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const project = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR || '/output';
mkdirSync(out, { recursive: true });
cpSync(join(project, 'app'), join(out, 'app'), { recursive: true });
const shotOut = join(out, 'screenshots');
mkdirSync(shotOut, { recursive: true });
if (existsSync(join(project, 'screenshots'))) {
  const shots = JSON.parse(readFileSync(join(project, 'shots.json'), 'utf8'));
  for (const shot of shots) cpSync(join(project, 'screenshots', shot.file), join(shotOut, shot.file));
}
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 3, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(out, 'dossier.json'), dossier);
