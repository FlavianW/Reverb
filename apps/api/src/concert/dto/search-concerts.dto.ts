import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SearchConcertsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  q!: string;
}
