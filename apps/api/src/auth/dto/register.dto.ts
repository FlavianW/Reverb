import type { RegisterRequest } from '@reverb/shared';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto implements RegisterRequest {
  @IsEmail()
  email!: string;

  /** bcrypt ignore silencieusement tout ce qui dépasse 72 octets : on borne en amont. */
  @IsString()
  @MinLength(8)
  @MaxLength(72)
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
