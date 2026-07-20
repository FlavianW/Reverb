import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Setlist telle qu'exposée par l'API Reverb : uniquement les titres, dans l'ordre joué. */
export interface SetlistFmResult {
  songs: string[];
}

interface SetlistFmSearchResponse {
  setlist?: Array<{
    sets?: {
      set?: Array<{
        song?: Array<{ name: string }>;
      }>;
    };
  }>;
}

/**
 * Concert tel qu'identifié par Setlist.fm, prêt à être importé dans Reverb (US-3.1).
 * `latitude`/`longitude` (US-9.1) sont à précision ville, `null` si Setlist.fm
 * ne les fournit pas pour cette entrée.
 */
export interface SetlistFmConcertMatch {
  artistName: string;
  venueName: string;
  city: string;
  date: Date;
  latitude: number | null;
  longitude: number | null;
}

interface SetlistFmConcertSearchResponse {
  setlist?: Array<{
    artist?: { name?: string };
    venue?: {
      name?: string;
      city?: { name?: string; coords?: { lat?: number; long?: number } };
    };
    eventDate?: string;
  }>;
}

const SETLISTFM_BASE_URL = 'https://api.setlist.fm/rest/1.0';

/**
 * Récupère la setlist d'un concert déjà joué via l'API Setlist.fm.
 * Toute indisponibilité (aucun résultat, erreur réseau, panne de l'API)
 * est absorbée en `null` : la page concert doit rester fonctionnelle même
 * quand Setlist.fm ne répond pas (US-2.1 : « setlist non disponible »).
 */
@Injectable()
export class SetlistFmService {
  private readonly logger = new Logger(SetlistFmService.name);

  constructor(private readonly configService: ConfigService) {}

  async findSetlist(params: {
    artistName: string;
    city: string;
    date: Date;
  }): Promise<SetlistFmResult | null> {
    const url = new URL(`${SETLISTFM_BASE_URL}/search/setlists`);
    url.searchParams.set('artistName', params.artistName);
    url.searchParams.set('cityName', params.city);
    url.searchParams.set('date', formatSetlistFmDate(params.date));

    try {
      const response = await fetch(url, {
        headers: {
          'x-api-key':
            this.configService.getOrThrow<string>('SETLISTFM_API_KEY'),
          Accept: 'application/json',
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        this.logger.warn(
          `Setlist.fm a répondu ${response.status} pour "${params.artistName}"`,
        );
        return null;
      }

      const data = (await response.json()) as SetlistFmSearchResponse;
      return parseFirstSetlist(data);
    } catch (error) {
      this.logger.warn(
        `Échec de l'appel à Setlist.fm : ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Cherche les concerts réels d'un artiste sur Setlist.fm (US-3.1) : la
   * recherche Reverb s'en sert pour importer automatiquement des concerts
   * pas encore présents en base. Comme `findSetlist`, toute indisponibilité
   * est absorbée en liste vide.
   */
  searchConcerts(artistName: string): Promise<SetlistFmConcertMatch[]> {
    return this.searchSetlistEntries({ artistName });
  }

  /**
   * Derniers concerts joués dans un pays (US-3.1, mode découverte) : permet
   * de peupler le catalogue au-delà des seuls artistes déjà recherchés.
   * Une seule page Setlist.fm (~20 entrées), la plus récente.
   */
  findRecentConcerts(countryCode: string): Promise<SetlistFmConcertMatch[]> {
    return this.searchSetlistEntries({ countryCode });
  }

  private async searchSetlistEntries(
    params: Record<string, string>,
  ): Promise<SetlistFmConcertMatch[]> {
    const url = new URL(`${SETLISTFM_BASE_URL}/search/setlists`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    try {
      const response = await fetch(url, {
        headers: {
          'x-api-key':
            this.configService.getOrThrow<string>('SETLISTFM_API_KEY'),
          Accept: 'application/json',
        },
      });

      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        this.logger.warn(
          `Setlist.fm a répondu ${response.status} pour la recherche ${JSON.stringify(params)}`,
        );
        return [];
      }

      const data = (await response.json()) as SetlistFmConcertSearchResponse;
      return parseConcertMatches(data);
    } catch (error) {
      this.logger.warn(
        `Échec de la recherche Setlist.fm : ${(error as Error).message}`,
      );
      return [];
    }
  }
}

/** Setlist.fm attend une date au format `dd-MM-yyyy`. */
function formatSetlistFmDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

/** Inverse de `formatSetlistFmDate` : Setlist.fm renvoie une date `dd-MM-yyyy`. */
function parseSetlistFmDate(value: string): Date {
  const [day, month, year] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Ignore les entrées incomplètes et dédoublonne (artiste/salle/ville/date identiques). */
function parseConcertMatches(
  data: SetlistFmConcertSearchResponse,
): SetlistFmConcertMatch[] {
  const seen = new Set<string>();
  const matches: SetlistFmConcertMatch[] = [];

  for (const entry of data.setlist ?? []) {
    const artistName = entry.artist?.name;
    const venueName = entry.venue?.name;
    const city = entry.venue?.city?.name;
    const eventDate = entry.eventDate;
    if (!artistName || !venueName || !city || !eventDate) {
      continue;
    }

    const key = `${artistName}|${venueName}|${city}|${eventDate}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const coords = entry.venue?.city?.coords;
    matches.push({
      artistName,
      venueName,
      city,
      date: parseSetlistFmDate(eventDate),
      latitude: coords?.lat ?? null,
      longitude: coords?.long ?? null,
    });
  }

  return matches;
}

function parseFirstSetlist(
  data: SetlistFmSearchResponse,
): SetlistFmResult | null {
  const firstSetlist = data.setlist?.[0];
  if (!firstSetlist) {
    return null;
  }

  const songs = (firstSetlist.sets?.set ?? []).flatMap((set) =>
    (set.song ?? []).map((song) => song.name),
  );

  return songs.length > 0 ? { songs } : null;
}
