import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post as HttpPost,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type {
  PostPage,
  PostSummary,
  PresignPostVideoUploadResponse,
  PublicUser,
} from '@reverb/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { buildOptionalImageFilesValidator } from '../media/image-upload.validator';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateVideoPostDto } from './dto/create-video-post.dto';
import { ListPostsDto } from './dto/list-posts.dto';
import { PresignVideoPostDto } from './dto/presign-video-post.dto';
import { LikeService } from './like/like.service';
import { PostService } from './post.service';

/** Fil d'actualité et posts (US-8.x). */
@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly likeService: LikeService,
  ) {}

  /** Fil d'actualité paginé : posts de l'utilisateur connecté et de ses amis (US-8.1). */
  @Get('feed')
  async getFeed(
    @Query() query: ListPostsDto,
    @CurrentUser() user: PublicUser,
  ): Promise<PostPage> {
    return this.postService.getFeed(user.id, query.cursor, query.take);
  }

  /** Crée un post explicite (photos et/ou texte, US-8.2). */
  @HttpPost()
  @UseInterceptors(FilesInterceptor('photos', 4))
  async create(
    @UploadedFiles(buildOptionalImageFilesValidator())
    files: Express.Multer.File[] | undefined,
    @Body() dto: CreatePostDto,
    @CurrentUser() user: PublicUser,
  ): Promise<PostSummary> {
    return this.postService.createPhotoPost(user.id, {
      content: dto.content,
      concertId: dto.concertId,
      files: files ?? [],
    });
  }

  /** Demande une URL d'upload vidéo direct vers S3 pour un futur post (US-8.2). */
  @HttpPost('videos/presign')
  async presignVideo(
    @Body() dto: PresignVideoPostDto,
  ): Promise<PresignPostVideoUploadResponse> {
    return this.postService.presignVideoUpload(dto.contentType);
  }

  /** Crée un post explicite dont le média est une vidéo déjà uploadée (US-8.2). */
  @HttpPost('videos')
  async createVideoPost(
    @Body() dto: CreateVideoPostDto,
    @CurrentUser() user: PublicUser,
  ): Promise<PostSummary> {
    return this.postService.createVideoPost(user.id, {
      postId: dto.postId,
      key: dto.key,
      content: dto.content,
      concertId: dto.concertId,
    });
  }

  /** Supprime un post explicite (réservé à l'auteur ; les posts automatiques suivent leur source). */
  @Delete(':id')
  @HttpCode(204)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: PublicUser,
  ): Promise<void> {
    await this.postService.delete(id, user.id);
  }

  /** Aime un post (idempotent, US-8.3). */
  @Put(':id/like')
  @HttpCode(204)
  async like(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: PublicUser,
  ): Promise<void> {
    await this.likeService.like(id, user.id);
  }

  /** Retire un « J'aime » (idempotent, US-8.3). */
  @Delete(':id/like')
  @HttpCode(204)
  async unlike(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: PublicUser,
  ): Promise<void> {
    await this.likeService.unlike(id, user.id);
  }
}
