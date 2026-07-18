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

  @Get('me')
  async getOverview(
    @CurrentUser() user: PublicUser,
  ): Promise<FriendshipOverview> {
    return this.friendshipService.getOverview(user.id);
  }

  @Get('status/:pseudo')
  async getStatus(
    @Param('pseudo') pseudo: string,
    @CurrentUser() user: PublicUser,
  ): Promise<FriendshipStatusWithUser> {
    return this.friendshipService.getStatusWith(user.id, pseudo);
  }

  @Post('requests/:pseudo')
  async sendRequest(
    @Param('pseudo') pseudo: string,
    @CurrentUser() user: PublicUser,
  ): Promise<FriendshipSummary> {
    return this.friendshipService.sendRequest(user.id, pseudo);
  }

  @Put(':id/accept')
  @HttpCode(204)
  async accept(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: PublicUser,
  ): Promise<void> {
    await this.friendshipService.accept(id, user.id);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: PublicUser,
  ): Promise<void> {
    await this.friendshipService.remove(id, user.id);
  }
}
