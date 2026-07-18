import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FriendshipModule } from '../friendship/friendship.module';
import { UserModule } from '../user/user.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  imports: [AuthModule, UserModule, FriendshipModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
})
export class ChatModule {}
