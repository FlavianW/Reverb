import { Injectable } from '@nestjs/common';
import { Concert } from '@prisma/client';
import type { ConcertRatingSummary } from '@reverb/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CommentService, CommentSummary } from './comment/comment.service';
import { PhotoService, PhotoSummary } from './photo/photo.service';
import { ConcertRatingService } from './rating/concert-rating.service';
import { SetlistFmResult, SetlistFmService } from './setlistfm.service';

export interface CreateConcertInput {
  artistName: string;
  venueName: string;
  city: string;
  date: Date;
}

/** Page concert exposée au client : les infos de base + setlist, notation, commentaires et photos. */
export interface ConcertPage extends Concert {
  setlist: SetlistFmResult | null;
  rating: ConcertRatingSummary;
  comments: CommentSummary[];
  photos: PhotoSummary[];
}

/**
 * Gère les concerts. La setlist n'est jamais stockée en base : elle est
 * récupérée en direct via Setlist.fm, seulement pour les concerts déjà
 * passés (Setlist.fm ne référence que des shows déjà joués).
 */
@Injectable()
export class ConcertService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly setlistFmService: SetlistFmService,
    private readonly ratingService: ConcertRatingService,
    private readonly commentService: CommentService,
    private readonly photoService: PhotoService,
  ) {}

  create(input: CreateConcertInput, createdById: string): Promise<Concert> {
    return this.prisma.concert.create({
      data: { ...input, createdById },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.concert.count({ where: { id } });
    return count > 0;
  }

  /**
   * Recherche des concerts par artiste ou par salle (US-3.1). Sans `query`
   * (absente ou vide), sert aussi de fil d'accueil : les concerts les plus
   * récents. Les résultats les plus récents sont toujours priorisés ; la
   * liste est vide s'il n'y a aucune correspondance (« aucun résultat » géré
   * côté client).
   */
  search(query?: string): Promise<Concert[]> {
    const trimmed = query?.trim();
    return this.prisma.concert.findMany({
      where: trimmed
        ? {
            OR: [
              { artistName: { contains: trimmed, mode: 'insensitive' } },
              { venueName: { contains: trimmed, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { date: 'desc' },
      take: 20,
    });
  }

  async findPageById(id: string): Promise<ConcertPage | null> {
    const concert = await this.prisma.concert.findUnique({ where: { id } });
    if (!concert) {
      return null;
    }

    const isPast = concert.date.getTime() <= Date.now();
    const [setlist, rating, comments, photos] = await Promise.all([
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
    ]);

    return { ...concert, setlist, rating, comments, photos };
  }
}
