import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  GoogleProfile,
  PublicUser,
  UserService,
  toPublicUser,
} from '../user/user.service';
import { GoogleAuthGuard } from './google-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

  /** Déclenche la redirection vers l'écran de consentement Google. */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin(): void {}

  /**
   * Callback appelé par Google après consentement. Crée le compte à la
   * première connexion (US-1.1) et le renvoie sous sa forme publique.
   */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request): Promise<PublicUser> {
    const profile = req.user as GoogleProfile;
    const user = await this.userService.findOrCreateFromGoogleProfile(profile);
    return toPublicUser(user);
  }
}
