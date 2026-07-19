import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import type {
  FriendshipOverview,
  FriendshipStatusWithUser,
  FriendshipSummary,
  PublicUser,
} from '@reverb/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FriendshipService } from './friendship.service';

/** Amitiés à validation mutuelle (US-7.1). */
@Controller('friendships')
@UseGuards(JwtAuthGuard)
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  /** Amis, demandes reçues et demandes envoyées de l'utilisateur connecté, en un seul appel. */
  @Get('me')
  async getOverview(
    @CurrentUser() user: PublicUser,
  ): Promise<FriendshipOverview> {
    return this.friendshipService.getOverview(user.id);
  }

  /** Statut de la relation entre l'utilisateur connecté et le profil visité. */
  @Get('status/:pseudo')
  async getStatus(
    @Param('pseudo') pseudo: string,
    @CurrentUser() user: PublicUser,
  ): Promise<FriendshipStatusWithUser> {
    return this.friendshipService.getStatusWith(user.id, pseudo);
  }

  /** Envoie une demande d'ami ; accepte automatiquement si une demande inverse est en attente. */
  @Post('requests/:pseudo')
  async sendRequest(
    @Param('pseudo') pseudo: string,
    @CurrentUser() user: PublicUser,
  ): Promise<FriendshipSummary> {
    return this.friendshipService.sendRequest(user.id, pseudo);
  }

  /** Accepte une demande reçue (réservé au destinataire). */
  @Put(':id/accept')
  @HttpCode(204)
  async accept(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: PublicUser,
  ): Promise<void> {
    await this.friendshipService.accept(id, user.id);
  }

  /** Annule une demande envoyée, refuse une demande reçue ou retire un ami. */
  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: PublicUser,
  ): Promise<void> {
    await this.friendshipService.remove(id, user.id);
  }
}
