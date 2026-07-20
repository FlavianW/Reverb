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

/** Une photo d'artiste résolue (ou son absence avérée), avec sa date de péremption. */
interface CachedArtistImage {
  url: string | null;
  expiresAt: number;
}

const IMAGE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
/** Borne le cache mémoire (une entrée ≈ une URL) — au-delà, la plus ancienne sort. */
const IMAGE_CACHE_MAX_ENTRIES = 500;

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
  private readonly imageCache = new Map<string, CachedArtistImage>();

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
   *
   * Le résultat est mémorisé 24 h : chaque affichage de profil re-scrapait la
   * page, et Last.fm rejette par intermittence les IP de datacenter trop
   * insistantes (406 anti-bot observés en production). En cas d'échec du
   * scraping, la dernière valeur connue est servie même périmée — une photo
   * datée vaut mieux qu'une photo qui disparaît pendant une panne Last.fm.
   */
  async getArtistImage(artistName: string): Promise<string | null> {
    const cacheKey = artistName.toLowerCase();
    const cached = this.imageCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }

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
        return cached ? cached.url : null;
      }

      const html = await response.text();
      const imageUrl = extractOgImage(html);
      this.cacheImage(cacheKey, imageUrl);
      return imageUrl;
    } catch (error) {
      this.logger.warn(
        `Échec de la récupération de la page Last.fm de "${artistName}" : ${(error as Error).message}`,
      );
      return cached ? cached.url : null;
    }
  }

  /**
   * Associe à chaque item la photo de son artiste, résolue une seule fois
   * par nom d'artiste distinct (peu coûteux grâce au cache de
   * `getArtistImage`). Partagé entre la recherche de concerts et les
   * concerts assistés d'un profil : même besoin, même logique.
   */
  async withArtistImages<T extends { artistName: string }>(
    items: T[],
  ): Promise<(T & { artistImageUrl: string | null })[]> {
    const distinctArtists = [...new Set(items.map((item) => item.artistName))];
    const images = await Promise.all(
      distinctArtists.map((name) => this.getArtistImage(name)),
    );
    const imageByArtist = new Map(
      distinctArtists.map((name, index) => [name, images[index]]),
    );

    return items.map((item) => ({
      ...item,
      artistImageUrl: imageByArtist.get(item.artistName) ?? null,
    }));
  }

  private cacheImage(cacheKey: string, url: string | null): void {
    if (
      this.imageCache.size >= IMAGE_CACHE_MAX_ENTRIES &&
      !this.imageCache.has(cacheKey)
    ) {
      const oldestKey = this.imageCache.keys().next().value;
      if (oldestKey !== undefined) {
        this.imageCache.delete(oldestKey);
      }
    }
    this.imageCache.set(cacheKey, {
      url,
      expiresAt: Date.now() + IMAGE_CACHE_TTL_MS,
    });
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
