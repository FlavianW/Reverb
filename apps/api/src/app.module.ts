import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ConcertModule } from './concert/concert.module';
import { FriendshipModule } from './friendship/friendship.module';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ConcertModule,
    FriendshipModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
