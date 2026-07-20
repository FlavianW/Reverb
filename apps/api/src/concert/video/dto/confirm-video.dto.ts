import type { ConfirmConcertVideoRequest } from '@reverb/shared';
import { IsString } from 'class-validator';

export class ConfirmVideoDto implements ConfirmConcertVideoRequest {
  @IsString()
  key!: string;
}
