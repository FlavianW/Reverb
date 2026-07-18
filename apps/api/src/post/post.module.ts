import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { LikeService } from './like/like.service';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  imports: [MediaModule],
  controllers: [PostController],
  providers: [PostService, LikeService],
  exports: [PostService],
})
export class PostModule {}
