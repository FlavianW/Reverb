import {
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { PublicProfile, PublicUser } from './user.service';
import { UserService, toPublicUser } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /** Profil public d'un utilisateur : bio, avatar et concerts assistés (US-4.1, US-4.2). */
  @Get(':pseudo')
  async getPublicProfile(
    @Param('pseudo') pseudo: string,
  ): Promise<PublicProfile> {
    const user = await this.userService.findByPseudo(pseudo);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    const attendedConcerts = await this.userService.findAttendedConcerts(
      user.id,
    );
    return {
      pseudo: user.pseudo,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      attendedConcerts,
    };
  }

  /** Met à jour le profil de l'utilisateur connecté (US-4.1). */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMyProfile(
    @Body() dto: UpdateProfileDto,
    @Req() req: Request,
  ): Promise<PublicUser> {
    const currentUser = req.user as PublicUser;

    if (dto.pseudo && dto.pseudo !== currentUser.pseudo) {
      const existing = await this.userService.findByPseudo(dto.pseudo);
      if (existing) {
        throw new ConflictException('Ce pseudo est déjà pris.');
      }
    }

    const updated = await this.userService.updateProfile(currentUser.id, dto);
    return toPublicUser(updated);
  }
}
