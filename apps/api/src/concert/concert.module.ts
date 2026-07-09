import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConcertAttendanceService } from './attendance/concert-attendance.service';
import { ConcertController } from './concert.controller';
import { ConcertService } from './concert.service';
import { ConcertRatingService } from './rating/concert-rating.service';
import { SetlistFmService } from './setlistfm.service';

@Module({
  imports: [AuthModule],
  controllers: [ConcertController],
  providers: [
    ConcertService,
    SetlistFmService,
    ConcertAttendanceService,
    ConcertRatingService,
  ],
})
export class ConcertModule {}
