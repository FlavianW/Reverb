import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GoogleProfile } from '../user/user.service';

/**
 * Guard Google OAuth qui remplace le message générique "Unauthorized" par
 * une erreur explicite (US-1.1 : "en cas d'échec OAuth, message d'erreur clair").
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  handleRequest<TUser = GoogleProfile>(
    err: unknown,
    user: TUser | false,
  ): TUser {
    if (err || !user) {
      throw new UnauthorizedException("Échec de l'authentification Google.");
    }
    return user;
  }
}
