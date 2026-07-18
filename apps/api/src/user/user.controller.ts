import {
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { PostPage, PublicUser } from '@reverb/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { buildImageFileValidator } from '../media/image-upload.validator';
import { ListPostsDto } from '../post/dto/list-posts.dto';
import { PostService } from '../post/post.service';
import { AvatarService } from './avatar/avatar.service';
import { BannerService } from './banner/banner.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { PublicProfile } from './user.service';
import { UserService, toPublicUser } from './user.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly avatarService: AvatarService,
    private readonly bannerService: BannerService,
    private readonly postService: PostService,
  ) {}

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
      bannerUrl: user.bannerUrl,
      favoriteArtist: user.favoriteArtist,
      attendedConcerts,
    };
  }

  /** Posts d'un utilisateur, affichés publiquement sur son profil (US-8.4). */
  @Get(':pseudo/posts')
  @UseGuards(JwtAuthGuard)
  async getPosts(
    @Param('pseudo') pseudo: string,
    @Query() query: ListPostsDto,
    @CurrentUser() viewer: PublicUser,
  ): Promise<PostPage> {
    const user = await this.userService.findByPseudo(pseudo);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    return this.postService.getByAuthorId(
      user.id,
      viewer.id,
      query.cursor,
      query.take,
    );
  }

  /** Met à jour le profil de l'utilisateur connecté (US-4.1). */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMyProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() currentUser: PublicUser,
  ): Promise<PublicUser> {
    if (dto.pseudo && dto.pseudo !== currentUser.pseudo) {
      const existing = await this.userService.findByPseudo(dto.pseudo);
      if (existing) {
        throw new ConflictException('Ce pseudo est déjà pris.');
      }
    }

    const updated = await this.userService.updateProfile(currentUser.id, dto);
    return toPublicUser(updated);
  }

  /** Change l'avatar de l'utilisateur connecté (US-4.1). */
  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadMyAvatar(
    @UploadedFile(buildImageFileValidator()) file: Express.Multer.File,
    @CurrentUser() user: PublicUser,
  ): Promise<PublicUser> {
    return this.avatarService.uploadForUser(user.id, file);
  }

  /** Change la bannière de l'utilisateur connecté (US-4.1). */
  @Post('me/banner')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('banner'))
  async uploadMyBanner(
    @UploadedFile(buildImageFileValidator()) file: Express.Multer.File,
    @CurrentUser() user: PublicUser,
  ): Promise<PublicUser> {
    return this.bannerService.uploadForUser(user.id, file);
  }
}
