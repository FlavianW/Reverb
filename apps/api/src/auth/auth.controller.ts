import {
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { GoogleProfile, PublicUser } from '../user/user.service';
import { UserService, toPublicUser } from '../user/user.service';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './google-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SESSION_COOKIE_NAME } from './session-cookie';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  /** Déclenche la redirection vers l'écran de consentement Google. */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin(): void {}

  /**
   * Callback appelé par Google après consentement. Crée le compte à la
   * première connexion (US-1.1), puis ouvre la session applicative en
   * posant un JWT dans un cookie httpOnly (US-1.2).
   */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PublicUser> {
    const profile = req.user as GoogleProfile;
    const user = await this.userService.findOrCreateFromGoogleProfile(profile);
    const token = this.authService.issueSessionToken(user);

    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return toPublicUser(user);
  }

  /** Profil de l'utilisateur actuellement connecté. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request): PublicUser {
    return req.user as PublicUser;
  }

  /** Invalide la session en supprimant le cookie (US-1.2). */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(SESSION_COOKIE_NAME);
  }
}
