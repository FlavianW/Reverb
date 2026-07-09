import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConcertController } from './concert.controller';
import { ConcertService } from './concert.service';
import { SetlistFmService } from './setlistfm.service';

@Module({
  imports: [AuthModule],
  controllers: [ConcertController],
  providers: [ConcertService, SetlistFmService],
})
export class ConcertModule {}
