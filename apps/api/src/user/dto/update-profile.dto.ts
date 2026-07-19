import type { UpdateProfileRequest } from '@reverb/shared';
import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto implements UpdateProfileRequest {
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

  /** Même restriction que la bio : pas de balises (protection XSS). */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[^<>]*$/, {
    message: "L'artiste favori ne peut pas contenir de balises.",
  })
  favoriteArtist?: string;
}
