import type { CreateConcertRequest } from '@reverb/shared';
import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateConcertDto implements CreateConcertRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  artistName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  venueName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  city!: string;

  /** Date ISO 8601 (ex: "2024-06-15" ou "2024-06-15T20:00:00Z"). */
  @IsDateString()
  date!: string;
}
