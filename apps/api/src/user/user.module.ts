import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { AvatarService } from './avatar/avatar.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [MediaModule],
  controllers: [UserController],
  providers: [UserService, AvatarService],
  exports: [UserService],
})
export class UserModule {}
