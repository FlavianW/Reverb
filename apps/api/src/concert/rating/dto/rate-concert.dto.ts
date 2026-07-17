import type { RateConcertRequest } from '@reverb/shared';
import { IsInt, Max, Min } from 'class-validator';

export class RateConcertDto implements RateConcertRequest {
  @IsInt()
  @Min(1)
  @Max(5)
  value!: number;
}
