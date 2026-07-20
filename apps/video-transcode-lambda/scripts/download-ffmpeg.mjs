// Télécharge un build statique ffmpeg/ffprobe (linux-x86_64, compatible
// Lambda) dans bin/, plutôt que de dépendre d'une Lambda Layer publique dont
// la disponibilité et le contenu ne sont pas garantis dans la durée pour
// cette région. Binaires volontairement hors Git (~80 Mo) : à relancer avant
// `pnpm run package`.
import { createWriteStream } from 'node:fs';
import { chmod, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const binDir = path.join(root, 'bin');
const archivePath = path.join(root, 'ffmpeg-release-amd64-static.tar.xz');

const RELEASE_URL =
  'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz';

async function download(url, destPath) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Téléchargement échoué (${response.status}) : ${url}`);
  }
  await pipeline(response.body, createWriteStream(destPath));
}

// bsdtar (Windows) interprète "C:\..." comme un hôte distant (syntaxe scp) à
// cause du ":" après la lettre de lecteur sans --force-local ; les chemins
// avec des slashes évitent en plus tout souci d'échappement de backslash
// dans les commandes passées à bash.
const toPosix = (p) => p.replaceAll('\\', '/');

async function main() {
  await rm(binDir, { recursive: true, force: true });
  await mkdir(binDir, { recursive: true });

  console.log('Téléchargement du build statique ffmpeg...');
  await download(RELEASE_URL, archivePath);

  console.log('Extraction...');
  await execFileAsync('tar', [
    '--force-local',
    '-xf',
    toPosix(archivePath),
    '-C',
    toPosix(root),
  ]);

  const [extractedDir] = (
    await execFileAsync('bash', ['-c', `ls -d "${toPosix(root)}"/ffmpeg-*-amd64-static`])
  ).stdout
    .trim()
    .split('\n');

  await execFileAsync('cp', [
    `${extractedDir}/ffmpeg`,
    toPosix(path.join(binDir, 'ffmpeg')),
  ]);
  await execFileAsync('cp', [
    `${extractedDir}/ffprobe`,
    toPosix(path.join(binDir, 'ffprobe')),
  ]);
  await chmod(path.join(binDir, 'ffmpeg'), 0o755);
  await chmod(path.join(binDir, 'ffprobe'), 0o755);

  await rm(archivePath, { force: true });
  await rm(extractedDir, { recursive: true, force: true });

  console.log('bin/ffmpeg et bin/ffprobe prêts.');
}

await main();
