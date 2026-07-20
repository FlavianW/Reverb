import type { CreateVideoPostRequest } from '@reverb/shared';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateVideoPostDto implements CreateVideoPostRequest {
  @IsUUID()
  postId!: string;

  @IsString()
  key!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  content?: string;

  @IsOptional()
  @IsUUID()
  concertId?: string;
}
