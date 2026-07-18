import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { PostModule } from '../post/post.module';
import { AvatarService } from './avatar/avatar.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [MediaModule, PostModule],
  controllers: [UserController],
  providers: [UserService, AvatarService],
  exports: [UserService],
})
export class UserModule {}
