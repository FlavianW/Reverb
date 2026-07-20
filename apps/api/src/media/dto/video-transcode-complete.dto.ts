import { IsInt, IsOptional, IsString, Min } from 'class-validator';

/** Corps envoyé par le Lambda de transcodage à la fin d'un traitement réussi. */
export class VideoTranscodeCompleteDto {
  @IsString()
  playbackKey!: string;

  @IsString()
  posterKey!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;
}
