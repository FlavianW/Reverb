import type { CreateCommentRequest } from '@reverb/shared';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateCommentDto implements CreateCommentRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  @Matches(/^[^<>]*$/, {
    message: 'Le commentaire ne peut pas contenir de balises HTML.',
  })
  content!: string;
}
