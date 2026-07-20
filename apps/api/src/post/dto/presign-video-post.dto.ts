import type { PresignVideoUploadRequest } from '@reverb/shared';
import { IsString } from 'class-validator';

export class PresignVideoPostDto implements PresignVideoUploadRequest {
  @IsString()
  contentType!: string;
}
