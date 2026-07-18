import { Module } from '@nestjs/common';
import { ArtistModule } from '../artist/artist.module';
import { MediaModule } from '../media/media.module';
import { PostModule } from '../post/post.module';
import { AvatarService } from './avatar/avatar.service';
import { BannerService } from './banner/banner.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [ArtistModule, MediaModule, PostModule],
  controllers: [UserController],
  providers: [UserService, AvatarService, BannerService],
  exports: [UserService],
})
export class UserModule {}
