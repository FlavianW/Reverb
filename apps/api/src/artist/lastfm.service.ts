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

const LASTFM_API_BASE_URL = 'https://ws.audioscrobbler.com/2.0/';
const LASTFM_SITE_BASE_URL = 'https://www.last.fm/music/';
const DEFAULT_USER_AGENT = 'Reverb/1.0 (+https://github.com/FlavianW/Reverb)';

/**
 * L'API JSON (`artist.search`, `artist.getinfo`) ne sert plus de vraies
 * photos depuis que Last.fm a changé sa politique d'images (~2018) : le
 * champ `image` renvoie ce placeholder générique pour quasi tous les
 * artistes, vérifié en direct sur plusieurs artistes distincts. On l'exclut
 * pour ne jamais afficher un faux visuel identique partout.
 */
const LASTFM_PLACEHOLDER_IMAGE_HASH = '2a96cbd8b46e442fc41c2b86b821562f';

/** Chemin CDN des vraies photos d'artiste (page web publique), pour ignorer un repli générique (logo Last.fm, etc). */
const ARTIST_IMAGE_CDN_PATTERN =
  /^https:\/\/lastfm\.freetls\.fastly\.net\/i\/u\/ar0\//;

/**
 * Récupère les artistes et leur photo. Deux sources distinctes, pour deux
 * usages différents :
 * - `searchArtists` (autocomplete, US-4.1) utilise l'API JSON documentée
 *   (`artist.search`) : rapide, mais son champ `image` est cassé (voir
 *   `LASTFM_PLACEHOLDER_IMAGE_HASH`), donc jamais utilisé comme photo.
 * - `getArtistImage` (photo affichée sur le profil et la page concert)
 *   récupère la balise `og:image` de la page publique
 *   `last.fm/music/<artiste>`, seule source qui renvoie encore une vraie
 *   photo par artiste — un choix délibéré (scraping HTML, pas un appel
 *   d'API) car l'API elle-même ne fournit plus cette donnée.
 *
 * Toute indisponibilité (aucun résultat, erreur réseau, panne) est absorbée
 * en liste vide / `null`, comme `SetlistFmService` : ces pages doivent
 * rester fonctionnelles même quand Last.fm ne répond pas.
 */
@Injectable()
export class LastFmService {
  private readonly logger = new Logger(LastFmService.name);

  constructor(private readonly configService: ConfigService) {}

  /** Suggestions pour l'autocomplete de l'artiste favori (US-4.1). */
  async searchArtists(query: string): Promise<ArtistSuggestion[]> {
    const url = new URL(LASTFM_API_BASE_URL);
    url.searchParams.set('method', 'artist.search');
    url.searchParams.set('artist', query);
    url.searchParams.set('limit', '8');
    url.searchParams.set(
      'api_key',
      this.configService.getOrThrow<string>('LASTFM_API_KEY'),
    );
    url.searchParams.set('format', 'json');

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
          imageUrl: extractNonPlaceholderImageUrl(match.image),
        }));
    } catch (error) {
      this.logger.warn(
        `Échec de la recherche d'artiste Last.fm : ${(error as Error).message}`,
      );
      return [];
    }
  }

  /**
   * Photo d'un artiste (US-4.1, page concert) : balise `og:image` de sa page
   * publique Last.fm, `null` si l'artiste est introuvable ou si la page ne
   * fournit pas de vraie photo (repli générique filtré).
   */
  async getArtistImage(artistName: string): Promise<string | null> {
    const url = `${LASTFM_SITE_BASE_URL}${encodeURIComponent(artistName)}`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            this.configService.get<string>('GEOCODING_USER_AGENT') ??
            DEFAULT_USER_AGENT,
        },
      });

      if (!response.ok) {
        this.logger.warn(
          `Last.fm a répondu ${response.status} pour la page de l'artiste "${artistName}"`,
        );
        return null;
      }

      const html = await response.text();
      return extractOgImage(html);
    } catch (error) {
      this.logger.warn(
        `Échec de la récupération de la page Last.fm de "${artistName}" : ${(error as Error).message}`,
      );
      return null;
    }
  }
}

/** Prend la plus grande image disponible, en excluant le placeholder générique connu. */
function extractNonPlaceholderImageUrl(
  images: LastFmImage[] | undefined,
): string | null {
  if (!images) {
    return null;
  }

  const large = [...images]
    .reverse()
    .find(
      (image) =>
        image['#text'] &&
        !image['#text'].includes(LASTFM_PLACEHOLDER_IMAGE_HASH),
    );

  return large?.['#text'] ?? null;
}

/** Extrait `content` de `<meta property="og:image" content="...">`, en ignorant un repli générique hors CDN artiste. */
function extractOgImage(html: string): string | null {
  const match = /<meta property="og:image"\s+content="([^"]+)"/.exec(html);
  const url = match?.[1];
  if (url && ARTIST_IMAGE_CDN_PATTERN.test(url)) {
    return url;
  }
  return null;
}
