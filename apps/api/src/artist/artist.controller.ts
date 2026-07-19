import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { ArtistSuggestion } from '@reverb/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SearchArtistsDto } from './dto/search-artists.dto';
import { LastFmService } from './lastfm.service';

@Controller('artists')
@UseGuards(JwtAuthGuard)
export class ArtistController {
  constructor(private readonly lastFmService: LastFmService) {}

  /** Suggestions pour l'autocomplete de l'artiste favori (US-4.1). */
  @Get('search')
  search(@Query() dto: SearchArtistsDto): Promise<ArtistSuggestion[]> {
    return this.lastFmService.searchArtists(dto.q);
  }
}
