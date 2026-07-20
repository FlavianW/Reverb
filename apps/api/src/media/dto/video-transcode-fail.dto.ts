import { IsString } from 'class-validator';

/** Corps envoyé par le Lambda de transcodage quand le traitement échoue. */
export class VideoTranscodeFailDto {
  @IsString()
  originalKey!: string;
}
