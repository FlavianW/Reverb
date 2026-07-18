import type { SearchArtistsRequest } from '@reverb/shared';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SearchArtistsDto implements SearchArtistsRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  q!: string;
}
