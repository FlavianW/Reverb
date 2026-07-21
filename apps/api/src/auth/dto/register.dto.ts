import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  type RegisterRequest,
} from '@reverb/shared';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto implements RegisterRequest {
  @IsEmail({}, { message: 'Adresse e-mail invalide.' })
  email!: string;

  /**
   * bcrypt ignore silencieusement tout ce qui dépasse 72 octets : on borne en
   * amont. Règles de complexité (OWASP A02/A07) alignées sur
   * `PASSWORD_REQUIREMENTS` (`@reverb/shared`), affichées comme prérequis
   * côté web/mobile - messages en français, pas les messages par défaut de
   * `class-validator` qui sont en anglais.
   */
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`,
  })
  @MaxLength(PASSWORD_MAX_LENGTH, {
    message: `Le mot de passe ne peut pas dépasser ${PASSWORD_MAX_LENGTH} caractères.`,
  })
  @Matches(/[A-Z]/, {
    message: 'Le mot de passe doit contenir au moins une majuscule.',
  })
  @Matches(/[a-z]/, {
    message: 'Le mot de passe doit contenir au moins une minuscule.',
  })
  @Matches(/[0-9]/, {
    message: 'Le mot de passe doit contenir au moins un chiffre.',
  })
  @Matches(/[^a-zA-Z0-9]/, {
    message: 'Le mot de passe doit contenir au moins un caractère spécial.',
  })
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'Le pseudo ne peut contenir que des lettres, chiffres, points, tirets et underscores.',
  })
  pseudo!: string;
}
