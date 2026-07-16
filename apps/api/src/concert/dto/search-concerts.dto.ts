import type { SearchConcertsRequest } from '@reverb/shared';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SearchConcertsDto implements SearchConcertsRequest {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}
