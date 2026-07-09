import { Injectable } from '@nestjs/common';
import { Concert } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConcertRatingService,
  ConcertRatingSummary,
} from './rating/concert-rating.service';
import { SetlistFmResult, SetlistFmService } from './setlistfm.service';

export interface CreateConcertInput {
  artistName: string;
  venueName: string;
  city: string;
  date: Date;
}

/** Page concert exposée au client : les infos de base + setlist et notation. */
export interface ConcertPage extends Concert {
  setlist: SetlistFmResult | null;
  rating: ConcertRatingSummary;
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

  async findPageById(id: string): Promise<ConcertPage | null> {
    const concert = await this.prisma.concert.findUnique({ where: { id } });
    if (!concert) {
      return null;
    }

    const isPast = concert.date.getTime() <= Date.now();
    const [setlist, rating] = await Promise.all([
      isPast
        ? this.setlistFmService.findSetlist({
            artistName: concert.artistName,
            city: concert.city,
            date: concert.date,
          })
        : Promise.resolve(null),
      this.ratingService.getSummary(id),
    ]);

    return { ...concert, setlist, rating };
  }
}
