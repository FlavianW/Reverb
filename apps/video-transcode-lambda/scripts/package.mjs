// Construit le paquet de déploiement Lambda : bundle esbuild (dist/handler.js,
// dépendances AWS SDK incluses) + binaires ffmpeg/ffprobe (bin/, télécharger
// via `pnpm run download-ffmpeg` au préalable), zippés ensemble. Uploadé via
// S3 (pas `--zip-file` direct) car le zip dépasse la limite de 50 Mo.
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const binDir = path.join(root, 'bin');
const distDir = path.join(root, 'dist');
const zipPath = path.join(root, 'video-transcode-lambda.zip');

async function zipWithPowerShell() {
  // Passer le dossier bin/ entier (pas ses fichiers un par un) préserve le
  // préfixe "bin/" dans le zip — nécessaire, le handler résout les binaires
  // via path.join(__dirname, 'bin', 'ffmpeg').
  const items = [path.join(distDir, 'handler.js'), binDir].map((p) => `"${p}"`).join(',');
  await execFileAsync('powershell', [
    '-NoProfile',
    '-Command',
    `Compress-Archive -Path ${items} -DestinationPath "${zipPath}" -Force`,
  ]);
}

async function zipWithUnixZip() {
  await execFileAsync('bash', [
    '-c',
    `cd "${distDir}" && zip -q "${zipPath}" handler.js && cd "${root}" && zip -q -r "${zipPath}" bin`,
  ]);
}

async function main() {
  if (!existsSync(path.join(binDir, 'ffmpeg')) || !existsSync(path.join(binDir, 'ffprobe'))) {
    throw new Error(
      'bin/ffmpeg ou bin/ffprobe manquant — lancer `npm run download-ffmpeg` avant `npm run package`.',
    );
  }
  if (!existsSync(path.join(distDir, 'handler.js'))) {
    throw new Error('dist/handler.js manquant — lancer `npm run build` avant `npm run package`.');
  }

  await rm(zipPath, { force: true });

  if (process.platform === 'win32') {
    await zipWithPowerShell();
  } else {
    await zipWithUnixZip();
  }

  console.log(`Paquet prêt : ${zipPath}`);
}

await main();
