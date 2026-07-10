import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'Le pseudo ne peut contenir que des lettres, chiffres, points, tirets et underscores.',
  })
  pseudo?: string;

  /** Même restriction que les commentaires : pas de `<`/`>` (protection XSS). */
  @IsOptional()
  @IsString()
  @MaxLength(280)
  @Matches(/^[^<>]*$/, {
    message: 'La bio ne peut pas contenir de balises.',
  })
  bio?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
