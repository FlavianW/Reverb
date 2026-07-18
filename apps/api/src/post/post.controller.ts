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
import type { PostPage, PostSummary, PublicUser } from '@reverb/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { buildOptionalImageFilesValidator } from '../media/image-upload.validator';
import { CreatePostDto } from './dto/create-post.dto';
import { ListPostsDto } from './dto/list-posts.dto';
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

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: PublicUser,
  ): Promise<void> {
    await this.postService.delete(id, user.id);
  }

  @Put(':id/like')
  @HttpCode(204)
  async like(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: PublicUser,
  ): Promise<void> {
    await this.likeService.like(id, user.id);
  }

  @Delete(':id/like')
  @HttpCode(204)
  async unlike(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: PublicUser,
  ): Promise<void> {
    await this.likeService.unlike(id, user.id);
  }
}
