import { Injectable } from '@nestjs/common';
import { Concert } from '@prisma/client';
import type { ConcertRatingSummary } from '@reverb/shared';
import { LastFmService } from '../artist/lastfm.service';
import { PrismaService } from '../prisma/prisma.service';
import { CommentService, CommentSummary } from './comment/comment.service';
import { GeocodingService } from './geocoding.service';
import { PhotoService, PhotoSummary } from './photo/photo.service';
import { ConcertRatingService } from './rating/concert-rating.service';
import {
  SetlistFmConcertMatch,
  SetlistFmResult,
  SetlistFmService,
} from './setlistfm.service';

export interface CreateConcertInput {
  artistName: string;
  venueName: string;
  city: string;
  date: Date;
}

/** Concert à proximité (US-9.1), avec sa distance calculée au point de recherche. */
export interface NearbyConcert extends Concert {
  distanceKm: number;
}

const EARTH_RADIUS_KM = 6371;

/**
 * Distance à vol d'oiseau entre deux points GPS (formule de Haversine).
 * Calcul en mémoire plutôt que via PostGIS : largement suffisant au nombre
 * de concerts attendu pour ce MVP, ne scale pas à des millions de lignes.
 */
export function haversineDistanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) *
      Math.cos(toRad(to.lat)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** Page concert exposée au client : les infos de base + setlist, notation, commentaires et photos. */
export interface ConcertPage extends Concert {
  setlist: SetlistFmResult | null;
  rating: ConcertRatingSummary;
  comments: CommentSummary[];
  photos: PhotoSummary[];
  artistImageUrl: string | null;
}

/** Résultat de recherche (US-3.1) : le concert et la photo de son artiste. */
export interface ConcertSearchResult extends Concert {
  artistImageUrl: string | null;
}

/**
 * Pays des concerts importés en mode découverte. L'app est francophone et
 * son public cible en France : choix documenté, à élargir si besoin.
 */
const DISCOVERY_COUNTRY_CODE = 'FR';

/** Au plus un import découverte par heure : le catalogue n'a pas besoin de plus frais. */
const DISCOVERY_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Gère les concerts. La setlist n'est jamais stockée en base : elle est
 * récupérée en direct via Setlist.fm, seulement pour les concerts déjà
 * passés (Setlist.fm ne référence que des shows déjà joués).
 */
@Injectable()
export class ConcertService {
  /** Horodatage du dernier import découverte (voir `discoverRecentConcerts`). */
  private lastDiscoveryAt = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly setlistFmService: SetlistFmService,
    private readonly geocodingService: GeocodingService,
    private readonly ratingService: ConcertRatingService,
    private readonly commentService: CommentService,
    private readonly photoService: PhotoService,
    private readonly lastFmService: LastFmService,
  ) {}

  /**
   * Crée un concert saisi manuellement (sans passer par l'import Setlist.fm).
   * La ville est géocodée pour que le concert apparaisse sur la carte de
   * proximité (US-9.1) ; un échec de géocodage n'empêche jamais la création.
   */
  async create(
    input: CreateConcertInput,
    createdById: string,
  ): Promise<Concert> {
    const coords = await this.geocodingService.geocodeCity(input.city);
    return this.prisma.concert.create({
      data: {
        ...input,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        createdById,
      },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.concert.count({ where: { id } });
    return count > 0;
  }

  /**
   * Recherche des concerts par artiste ou par salle (US-3.1). Sans `query`
   * (absente ou vide), sert de vitrine : les concerts les plus récents du
   * catalogue, régulièrement enrichi par un import découverte (voir
   * `discoverRecentConcerts`). Chaque résultat embarque la photo de son
   * artiste — peu coûteux grâce au cache de `LastFmService`.
   *
   * Quand `importedForUserId` est fourni avec une requête non vide, Reverb
   * interroge aussi Setlist.fm et importe les concerts correspondants pas
   * encore en base avant de renvoyer les résultats : la page concert (avec
   * sa setlist réelle) existe donc dès la recherche, pas seulement pour les
   * concerts déjà connus de Reverb.
   */
  async search(
    query?: string,
    importedForUserId?: string,
  ): Promise<ConcertSearchResult[]> {
    const trimmed = query?.trim();

    if (importedForUserId) {
      if (trimmed) {
        await this.importFromSetlistFm(trimmed, importedForUserId);
      } else {
        await this.discoverRecentConcerts(importedForUserId);
      }
    }

    const concerts = await this.prisma.concert.findMany({
      where: trimmed
        ? {
            OR: [
              { artistName: { contains: trimmed, mode: 'insensitive' } },
              { venueName: { contains: trimmed, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { date: 'desc' },
      take: 36,
    });

    return this.withArtistImages(concerts);
  }

  /** Joint à chaque concert la photo de son artiste, résolue une seule fois par artiste distinct. */
  private async withArtistImages(
    concerts: Concert[],
  ): Promise<ConcertSearchResult[]> {
    const distinctArtists = [...new Set(concerts.map((c) => c.artistName))];
    const images = await Promise.all(
      distinctArtists.map((name) => this.lastFmService.getArtistImage(name)),
    );
    const imageByArtist = new Map(
      distinctArtists.map((name, index) => [name, images[index]]),
    );

    return concerts.map((concert) => ({
      ...concert,
      artistImageUrl: imageByArtist.get(concert.artistName) ?? null,
    }));
  }

  /**
   * Import découverte (US-3.1) : les derniers concerts joués en France selon
   * Setlist.fm, pour que le catalogue vive au-delà des artistes déjà
   * recherchés. Throttlé en mémoire à un appel par heure — suffisant pour la
   * fraîcheur, et respectueux du quota de l'API.
   */
  private async discoverRecentConcerts(createdById: string): Promise<void> {
    if (Date.now() - this.lastDiscoveryAt < DISCOVERY_INTERVAL_MS) {
      return;
    }
    this.lastDiscoveryAt = Date.now();

    const matches =
      await this.setlistFmService.findRecentConcerts(DISCOVERY_COUNTRY_CODE);
    await this.importMatches(matches, createdById);
  }

  /** Importe les concerts que Setlist.fm connaît pour cet artiste, sans dupliquer ceux déjà en base. */
  private async importFromSetlistFm(
    artistName: string,
    createdById: string,
  ): Promise<void> {
    const matches = await this.setlistFmService.searchConcerts(artistName);
    await this.importMatches(matches, createdById);
  }

  private async importMatches(
    matches: SetlistFmConcertMatch[],
    createdById: string,
  ): Promise<void> {
    for (const match of matches) {
      const alreadyImported = await this.prisma.concert.findFirst({
        where: {
          artistName: match.artistName,
          venueName: match.venueName,
          city: match.city,
          date: match.date,
        },
      });

      if (!alreadyImported) {
        await this.prisma.concert.create({ data: { ...match, createdById } });
      }
    }
  }

  /**
   * Concerts à venir avec coordonnées connues situés dans un rayon donné
   * (US-9.1), triés du plus proche au plus lointain. Les concerts déjà passés
   * sont exclus (aller à un concert terminé n'a pas de sens), de même que les
   * concerts sans coordonnées (Setlist.fm et le géocodage ont tous deux échoué).
   */
  async findNearby(
    lat: number,
    lng: number,
    radiusKm = 50,
  ): Promise<NearbyConcert[]> {
    const concerts = await this.prisma.concert.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        date: { gte: new Date() },
      },
    });

    return concerts
      .map((concert) => ({
        ...concert,
        distanceKm: haversineDistanceKm(
          { lat, lng },
          { lat: concert.latitude!, lng: concert.longitude! },
        ),
      }))
      .filter((concert) => concert.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  async findPageById(id: string): Promise<ConcertPage | null> {
    const concert = await this.prisma.concert.findUnique({ where: { id } });
    if (!concert) {
      return null;
    }

    const isPast = concert.date.getTime() <= Date.now();
    const [setlist, rating, comments, photos, artistImageUrl] =
      await Promise.all([
        isPast
          ? this.setlistFmService.findSetlist({
              artistName: concert.artistName,
              city: concert.city,
              date: concert.date,
            })
          : Promise.resolve(null),
        this.ratingService.getSummary(id),
        this.commentService.findByConcert(id),
        this.photoService.findByConcert(id),
        this.lastFmService.getArtistImage(concert.artistName),
      ]);

    return { ...concert, setlist, rating, comments, photos, artistImageUrl };
  }
}
