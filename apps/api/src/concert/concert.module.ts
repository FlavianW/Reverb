import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConcertAttendanceService } from './attendance/concert-attendance.service';
import { CommentController } from './comment/comment.controller';
import { CommentService } from './comment/comment.service';
import { ConcertController } from './concert.controller';
import { ConcertService } from './concert.service';
import { ConcertRatingService } from './rating/concert-rating.service';
import { SetlistFmService } from './setlistfm.service';

@Module({
  imports: [AuthModule],
  controllers: [ConcertController, CommentController],
  providers: [
    ConcertService,
    SetlistFmService,
    ConcertAttendanceService,
    ConcertRatingService,
    CommentService,
  ],
})
export class ConcertModule {}
