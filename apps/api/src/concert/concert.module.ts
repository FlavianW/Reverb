import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { ConcertAttendanceService } from './attendance/concert-attendance.service';
import { CommentController } from './comment/comment.controller';
import { CommentService } from './comment/comment.service';
import { ConcertController } from './concert.controller';
import { ConcertService } from './concert.service';
import { PhotoController } from './photo/photo.controller';
import { PhotoService } from './photo/photo.service';
import { ConcertRatingService } from './rating/concert-rating.service';
import { ReportService } from './report/report.service';
import { SetlistFmService } from './setlistfm.service';

@Module({
  imports: [AuthModule, MediaModule],
  controllers: [ConcertController, CommentController, PhotoController],
  providers: [
    ConcertService,
    SetlistFmService,
    ConcertAttendanceService,
    ConcertRatingService,
    CommentService,
    PhotoService,
    ReportService,
  ],
})
export class ConcertModule {}
