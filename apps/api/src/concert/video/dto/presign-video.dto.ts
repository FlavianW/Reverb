import type { PresignVideoUploadRequest } from '@reverb/shared';
import { IsString } from 'class-validator';

export class PresignVideoDto implements PresignVideoUploadRequest {
  @IsString()
  contentType!: string;
}
