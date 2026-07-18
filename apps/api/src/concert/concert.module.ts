import { Module } from '@nestjs/common';
import { ArtistModule } from '../artist/artist.module';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { PostModule } from '../post/post.module';
import { ConcertAttendanceService } from './attendance/concert-attendance.service';
import { CommentController } from './comment/comment.controller';
import { CommentService } from './comment/comment.service';
import { ConcertController } from './concert.controller';
import { ConcertService } from './concert.service';
import { PhotoController } from './photo/photo.controller';
import { PhotoService } from './photo/photo.service';
import { ConcertRatingService } from './rating/concert-rating.service';
import { ReportService } from './report/report.service';
import { GeocodingService } from './geocoding.service';
import { SetlistFmService } from './setlistfm.service';

@Module({
  imports: [ArtistModule, AuthModule, MediaModule, PostModule],
  controllers: [ConcertController, CommentController, PhotoController],
  providers: [
    ConcertService,
    SetlistFmService,
    GeocodingService,
    ConcertAttendanceService,
    ConcertRatingService,
    CommentService,
    PhotoService,
    ReportService,
  ],
})
export class ConcertModule {}
