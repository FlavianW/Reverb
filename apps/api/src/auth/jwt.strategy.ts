import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { PublicUser } from '@reverb/shared';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService, toPublicUser } from '../user/user.service';
import { SessionTokenPayload } from './auth.service';
import { SESSION_COOKIE_NAME } from './session-cookie';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null =>
          (req.cookies as Record<string, string> | undefined)?.[
            SESSION_COOKIE_NAME
          ] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /** Résout le payload du JWT en profil public ; rejette si le compte n'existe plus. */
  async validate(payload: SessionTokenPayload): Promise<PublicUser> {
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return toPublicUser(user);
  }
}
