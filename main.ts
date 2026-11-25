// Ember & Oak — Smokehouse Kitchen: the hand-in program.
//
// Node 22, standard library only. It copies game/ and screenshots/ from the
// repository into /output (or MAKEFUN_OUTPUT_DIR outside the grader) and
// writes /output/dossier.json with buildDossier from vendor/makefun-game.ts,
// exactly as the kit's starter does. The repository is resolved the way the
// grader mounts it: $MAKEFUN_BOT_DIR first, then /bot, then this file's own
// directory, then the working directory — the first one that holds a game/
// with an index.html wins, so a bare relative path never fails because the
// grader's cwd is not the repo root.
//
// Usage (outside the grader): mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The program writes ONLY to /output (or MAKEFUN_OUTPUT_DIR); it reads only
// from the repository. Running it twice produces byte-identical output.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url));
const OUT = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// --- find the repository -------------------------------------------------
function repoCandidates() {
  const cands = [];
  if (process.env.MAKEFUN_BOT_DIR) cands.push(process.env.MAKEFUN_BOT_DIR);
  cands.push('/bot', SCRIPT_DIR, process.cwd());
  return cands;
}

function findRepo() {
  for (const dir of repoCandidates()) {
    if (existsSync(join(dir, 'game', 'index.html'))) return resolve(dir);
  }
  throw new Error(
    'Ember & Oak: no game/index.html found under $MAKEFUN_BOT_DIR, /bot, the script directory or cwd.',
  );
}

const repo = findRepo();
const out = resolve(OUT);

// --- gate-shaped checks before writing ------------------------------------
function fail(msg) {
  throw new Error(`Ember & Oak hand-in refused: ${msg}`);
}

const indexStat = statSync(join(repo, 'game', 'index.html'));
if (!indexStat.isFile() || indexStat.size > 1024 * 1024) fail('game/index.html missing or over 1 MiB');

const shotDir = join(repo, 'screenshots');
if (!existsSync(shotDir)) fail('screenshots/ is missing');
const shots = readdirSync(shotDir)
  .filter((n) => !n.startsWith('.'))
  .sort();
if (shots.length < 3 || shots.length > 4) fail(`screenshots/ must hold 3 or 4 images, found ${shots.length}`);
for (const name of shots) {
  const st = statSync(join(shotDir, name));
  if (!st.isFile()) fail(`screenshots/${name} is not a regular file`);
  if (st.size > 256 * 1024) fail(`screenshots/${name} is over 256 KiB (${st.size} bytes)`);
  if (!/\.(png|jpe?g)$/i.test(name)) fail(`screenshots/${name} is not a PNG or JPEG`);
}

let gameFiles = 0;
let gameBytes = 0;
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (Buffer.byteLength(p, 'utf8') > 1000) fail(`game path over 1000 bytes: ${p}`);
    if (entry.isDirectory()) { gameFiles += 1; walk(p); }
    else if (entry.isFile()) { gameFiles += 1; gameBytes += statSync(p).size; }
    else fail(`game/ holds a non-file entry: ${p}`);
  }
})(join(repo, 'game'));
if (gameFiles > 993) fail(`game/ holds ${gameFiles} files+dirs, over the 993 cap`);
if (gameBytes > 48 * 1024 * 1024) fail(`game/ is ${gameBytes} bytes, over the 48 MiB cap`);

// --- write /output --------------------------------------------------------
// Clear any previous run's output first: cpSync merges, and stale files
// from an earlier build would make two runs of the same repo differ.
mkdirSync(out, { recursive: true });
rmSync(join(out, 'game'), { recursive: true, force: true });
rmSync(join(out, 'screenshots'), { recursive: true, force: true });
rmSync(join(out, 'dossier.json'), { force: true });
cpSync(join(repo, 'game'), join(out, 'game'), { recursive: true });
cpSync(shotDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the bytes; the others refuse an entry the scorer would refuse (more than
// 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB
// of game files, in all, or a path under game/ over 1000 bytes).
const dossier = Buffer.from(buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
}));
if (dossier.length > 1536 * 1024) fail('dossier.json is over the 1.5 MiB cap');
writeFileSync(join(out, 'dossier.json'), dossier);

const sha = createHash('sha256').update(dossier).digest('hex');

// --- verify what was written ---------------------------------------------
// A hand-in that silently copies the wrong bytes is worse than one that
// fails loudly, so re-read /output and compare against the sources.
function shaFile(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}
if (shaFile(join(out, 'game', 'index.html')) !== shaFile(join(repo, 'game', 'index.html'))) {
  fail('/output/game/index.html does not match the repository copy');
}
for (const name of shots) {
  if (shaFile(join(out, 'screenshots', name)) !== shaFile(join(shotDir, name))) {
    fail(`/output/screenshots/${name} does not match the repository copy`);
  }
}
if (!readFileSync(join(out, 'dossier.json')).equals(dossier)) {
  fail('/output/dossier.json does not match what buildDossier wrote');
}
if (createHash('sha256').update(readFileSync(join(out, 'dossier.json'))).digest('hex') !== sha) {
  fail('/output/dossier.json changed between writing and verifying');
}
console.log(`Ember & Oak handed in from ${repo}`);
console.log(`  game: ${gameFiles} files+dirs, ${gameBytes} bytes`);
console.log(`  screenshots: ${shots.join(', ')}`);
console.log(`  dossier.json: ${dossier.length} bytes, sha256 ${sha}`);
