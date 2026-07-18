import type { CreatePostRequest } from '@reverb/shared';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePostDto implements CreatePostRequest {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  content?: string;

  @IsOptional()
  @IsUUID()
  concertId?: string;
}
