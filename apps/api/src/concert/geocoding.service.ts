import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const DEFAULT_USER_AGENT = 'Reverb/1.0 (+https://github.com/FlavianW/Reverb)';

interface NominatimSearchResult {
  lat: string;
  lon: string;
}

/**
 * Géocode une ville en coordonnées (précision ville) via Nominatim (OSM),
 * en repli pour les concerts créés manuellement (US-9.1) — les concerts
 * importés depuis Setlist.fm ont déjà leurs coordonnées (voir `SetlistFmService`).
 * Comme `SetlistFmService`, toute indisponibilité est absorbée en `null` :
 * la création d'un concert ne doit jamais échouer faute de géocodage.
 */
@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  constructor(private readonly configService: ConfigService) {}

  async geocodeCity(city: string): Promise<GeocodingResult | null> {
    const url = new URL(NOMINATIM_BASE_URL);
    url.searchParams.set('q', city);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            this.configService.get<string>('GEOCODING_USER_AGENT') ??
            DEFAULT_USER_AGENT,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.warn(
          `Nominatim a répondu ${response.status} pour la ville "${city}"`,
        );
        return null;
      }

      const results = (await response.json()) as NominatimSearchResult[];
      const first = results[0];
      if (!first) {
        return null;
      }

      return { latitude: Number(first.lat), longitude: Number(first.lon) };
    } catch (error) {
      this.logger.warn(
        `Échec du géocodage de la ville "${city}" : ${(error as Error).message}`,
      );
      return null;
    }
  }
}
