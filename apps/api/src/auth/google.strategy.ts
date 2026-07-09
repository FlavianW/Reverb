import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { GoogleProfile } from '../user/user.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  /**
   * Traduit le profil Google en `GoogleProfile` interne. Une adresse e-mail
   * est indispensable (identifiant de contact et de récupération de compte) ;
   * son absence fait échouer l'authentification avec un message clair.
   */
  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): GoogleProfile {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new UnauthorizedException(
        "Google n'a fourni aucune adresse e-mail.",
      );
    }

    return {
      googleId: profile.id,
      email,
      displayName: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
    };
  }
}
