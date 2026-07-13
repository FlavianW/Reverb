import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { GoogleProfile, PublicUser } from '../user/user.service';
import { UserService, toPublicUser } from '../user/user.service';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleAuthGuard } from './google-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PasswordService } from './password.service';
import { SESSION_COOKIE_NAME } from './session-cookie';

/**
 * Hash bcrypt d'une valeur sans rapport avec un vrai mot de passe, utilisé
 * uniquement pour que `login` prenne le même temps qu'un email existe ou
 * non (sinon l'absence d'appel bcrypt révélerait par timing les emails
 * inscrits — une fuite d'énumération de comptes classique en OWASP).
 */
const DUMMY_PASSWORD_HASH =
  '$2a$10$CwTycUXWue0Thq9StjUM0uJ8n1DzYSXO/GpJDS0Jhz.oIALqYIvB2';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly passwordService: PasswordService,
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
    this.openSession(user, res);
    return toPublicUser(user);
  }

  /**
   * Inscription email/mot de passe (US-1.1 bis). Alternative à l'OAuth Google :
   * ouvre directement la session applicative comme un login réussi.
   */
  @Post('register')
  @UseGuards(ThrottlerGuard)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PublicUser> {
    if (await this.userService.findByEmail(dto.email)) {
      throw new ConflictException('Cette adresse e-mail est déjà utilisée.');
    }
    if (await this.userService.findByPseudo(dto.pseudo)) {
      throw new ConflictException('Ce pseudo est déjà pris.');
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);
    const user = await this.userService.createWithPassword({
      email: dto.email,
      pseudo: dto.pseudo,
      passwordHash,
    });

    this.openSession(user, res);
    return toPublicUser(user);
  }

  /**
   * Connexion email/mot de passe (US-1.2 bis). Message d'erreur générique
   * dans tous les cas d'échec (email inconnu, compte OAuth sans mot de
   * passe, mot de passe incorrect) pour ne pas révéler quels emails existent.
   */
  @Post('login')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PublicUser> {
    const user = await this.userService.findByEmail(dto.email);
    const isValid = await this.passwordService.verifyPassword(
      dto.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !user.passwordHash || !isValid) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    this.openSession(user, res);
    return toPublicUser(user);
  }

  /** Profil de l'utilisateur actuellement connecté. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: PublicUser): PublicUser {
    return user;
  }

  /** Invalide la session en supprimant le cookie (US-1.2). */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(SESSION_COOKIE_NAME);
  }

  /** Émet un JWT de session et le pose dans un cookie httpOnly. */
  private openSession(user: { id: string }, res: Response): void {
    const token = this.authService.issueSessionToken(user);
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }
}
