import { Module } from '@nestjs/common';
import { ArtistModule } from '../artist/artist.module';
import { MediaModule } from '../media/media.module';
import { PostModule } from '../post/post.module';
import { ProfileImageService } from './profile-image.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [ArtistModule, MediaModule, PostModule],
  controllers: [UserController],
  providers: [UserService, ProfileImageService],
  exports: [UserService],
})
export class UserModule {}
