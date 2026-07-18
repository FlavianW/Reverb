import type { SendMessageRequest } from '@reverb/shared';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto implements SendMessageRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;
}
