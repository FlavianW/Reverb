import { IsInt, IsOptional, IsString, Min } from 'class-validator';

/**
 * Corps envoyé par le Lambda de transcodage à la fin d'un traitement réussi.
 * Identifié par `originalKey` (la clé S3 de l'upload) et non par l'id de la
 * ligne `Video` : le Lambda ne connaît que l'événement S3 qui l'a déclenché.
 */
export class VideoTranscodeCompleteDto {
  @IsString()
  originalKey!: string;

  @IsString()
  playbackKey!: string;

  @IsString()
  posterKey!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;
}
