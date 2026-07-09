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
}

/** Setlist.fm attend une date au format `dd-MM-yyyy`. */
function formatSetlistFmDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
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
