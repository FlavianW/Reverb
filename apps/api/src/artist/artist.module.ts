import { Module } from '@nestjs/common';
import { ArtistController } from './artist.controller';
import { LastFmService } from './lastfm.service';

@Module({
  controllers: [ArtistController],
  providers: [LastFmService],
  exports: [LastFmService],
})
export class ArtistModule {}
