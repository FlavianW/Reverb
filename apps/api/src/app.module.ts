import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ArtistModule } from './artist/artist.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { ConcertModule } from './concert/concert.module';
import { FriendshipModule } from './friendship/friendship.module';
import { HealthController } from './health/health.controller';
import { PostModule } from './post/post.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ArtistModule,
    ConcertModule,
    FriendshipModule,
    PostModule,
    ChatModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
