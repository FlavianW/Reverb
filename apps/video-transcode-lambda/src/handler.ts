import { execFile } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { promisify } from 'node:util';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { S3Handler } from 'aws-lambda';
import {
  buildDurationProbeArgs,
  buildPlaybackArgs,
  buildPosterArgs,
  parseDurationSeconds,
} from './ffmpeg';
import { deriveOutputKeys, isOriginalVideoKey } from './video-key';
import { notifyComplete, notifyFailed, type WebhookConfig } from './webhook';

const execFileAsync = promisify(execFile);
const s3 = new S3Client({});

const FFMPEG_PATH = path.join(__dirname, 'bin', 'ffmpeg');
const FFPROBE_PATH = path.join(__dirname, 'bin', 'ffprobe');

function webhookConfig(): WebhookConfig {
  return {
    baseUrl: mustGetEnv('API_INTERNAL_WEBHOOK_URL'),
    secret: mustGetEnv('VIDEO_WEBHOOK_SECRET'),
  };
}

function mustGetEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name}`);
  }
  return value;
}

export const handler: S3Handler = async (event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    if (!isOriginalVideoKey(key)) {
      continue;
    }

    try {
      await processVideo(bucket, key);
    } catch (error) {
      console.error(`Échec du transcodage pour ${key}`, error);
      await notifyFailed(webhookConfig(), key).catch(
        (webhookError: unknown) => {
          console.error(
            `Échec de la notification d'échec pour ${key}`,
            webhookError,
          );
        },
      );
    }
  }
};

async function processVideo(bucket: string, key: string): Promise<void> {
  const workDir = await mkdtemp(path.join(tmpdir(), 'reverb-video-'));
  const inputPath = path.join(workDir, `input${path.extname(key)}`);
  const playbackPath = path.join(workDir, 'playback.mp4');
  const posterPath = path.join(workDir, 'poster.jpg');

  try {
    await downloadObject(bucket, key, inputPath);

    await execFileAsync(
      FFMPEG_PATH,
      buildPlaybackArgs(inputPath, playbackPath),
    );
    await execFileAsync(FFMPEG_PATH, buildPosterArgs(inputPath, posterPath));
    const { stdout } = await execFileAsync(
      FFPROBE_PATH,
      buildDurationProbeArgs(inputPath),
    );
    const durationSeconds = parseDurationSeconds(stdout);

    const { playbackKey, posterKey } = deriveOutputKeys(key);
    await uploadObject(bucket, playbackKey, playbackPath, 'video/mp4');
    await uploadObject(bucket, posterKey, posterPath, 'image/jpeg');

    await notifyComplete(webhookConfig(), {
      originalKey: key,
      playbackKey,
      posterKey,
      durationSeconds,
    });
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function downloadObject(
  bucket: string,
  key: string,
  destPath: string,
): Promise<void> {
  const response = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  const body = response.Body;
  if (!body || !('pipe' in body)) {
    throw new Error(`Corps S3 vide ou non streamable pour ${key}`);
  }
  await pipeline(body as NodeJS.ReadableStream, createWriteStream(destPath));
}

async function uploadObject(
  bucket: string,
  key: string,
  filePath: string,
  contentType: string,
): Promise<void> {
  const body = await readFile(filePath);
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}
