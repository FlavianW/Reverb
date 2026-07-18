import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ArtistSuggestion } from '@reverb/shared';

interface LastFmImage {
  '#text'?: string;
  size?: string;
}

interface LastFmArtistMatch {
  name?: string;
  image?: LastFmImage[];
}

interface LastFmSearchResponse {
  results?: {
    artistmatches?: {
      artist?: LastFmArtistMatch[] | LastFmArtistMatch;
    };
  };
}

interface LastFmArtistInfoResponse {
  artist?: {
    image?: LastFmImage[];
  };
}

const LASTFM_BASE_URL = 'https://ws.audioscrobbler.com/2.0/';
const PREFERRED_IMAGE_SIZES = ['extralarge', 'large', 'medium'];

/**
 * Récupère les artistes et leur photo via l'API Last.fm : autocomplete de
 * l'artiste favori (US-4.1) et illustration de la page concert. Toute
 * indisponibilité (aucun résultat, erreur réseau, panne de l'API) est
 * absorbée en liste vide / `null`, comme `SetlistFmService` : ces pages
 * doivent rester fonctionnelles même quand Last.fm ne répond pas.
 */
@Injectable()
export class LastFmService {
  private readonly logger = new Logger(LastFmService.name);

  constructor(private readonly configService: ConfigService) {}

  /** Suggestions pour l'autocomplete de l'artiste favori (US-4.1). */
  async searchArtists(query: string): Promise<ArtistSuggestion[]> {
    const url = this.buildUrl('artist.search', { artist: query, limit: '8' });

    try {
      const response = await fetch(url);
      if (!response.ok) {
        this.logger.warn(
          `Last.fm a répondu ${response.status} pour la recherche d'artiste "${query}"`,
        );
        return [];
      }

      const data = (await response.json()) as LastFmSearchResponse;
      const matches = data.results?.artistmatches?.artist;
      const list = Array.isArray(matches) ? matches : matches ? [matches] : [];

      return list
        .filter(
          (
            match,
          ): match is Required<Pick<LastFmArtistMatch, 'name'>> &
            LastFmArtistMatch => Boolean(match.name),
        )
        .map((match) => ({
          name: match.name,
          imageUrl: extractImageUrl(match.image),
        }));
    } catch (error) {
      this.logger.warn(
        `Échec de la recherche d'artiste Last.fm : ${(error as Error).message}`,
      );
      return [];
    }
  }

  /** Photo d'un artiste (US-4.1, page concert), `null` si Last.fm n'en fournit pas. */
  async getArtistImage(artistName: string): Promise<string | null> {
    const url = this.buildUrl('artist.getinfo', {
      artist: artistName,
      autocorrect: '1',
    });

    try {
      const response = await fetch(url);
      if (!response.ok) {
        this.logger.warn(
          `Last.fm a répondu ${response.status} pour l'artiste "${artistName}"`,
        );
        return null;
      }

      const data = (await response.json()) as LastFmArtistInfoResponse;
      return extractImageUrl(data.artist?.image);
    } catch (error) {
      this.logger.warn(
        `Échec de la récupération de l'artiste Last.fm : ${(error as Error).message}`,
      );
      return null;
    }
  }

  private buildUrl(method: string, params: Record<string, string>): URL {
    const url = new URL(LASTFM_BASE_URL);
    url.searchParams.set('method', method);
    url.searchParams.set(
      'api_key',
      this.configService.getOrThrow<string>('LASTFM_API_KEY'),
    );
    url.searchParams.set('format', 'json');
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return url;
  }
}

/** Prend la plus grande image disponible, `null` si Last.fm n'en fournit aucune. */
function extractImageUrl(images: LastFmImage[] | undefined): string | null {
  if (!images) {
    return null;
  }

  for (const size of PREFERRED_IMAGE_SIZES) {
    const match = images.find((image) => image.size === size);
    if (match?.['#text']) {
      return match['#text'];
    }
  }

  return null;
}
