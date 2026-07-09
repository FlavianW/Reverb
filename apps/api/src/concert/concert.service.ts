import { Injectable } from '@nestjs/common';
import { Concert } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SetlistFmResult, SetlistFmService } from './setlistfm.service';

export interface CreateConcertInput {
  artistName: string;
  venueName: string;
  city: string;
  date: Date;
}

/** Page concert exposée au client : les infos de base + la setlist si disponible. */
export interface ConcertPage extends Concert {
  setlist: SetlistFmResult | null;
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
    const setlist = isPast
      ? await this.setlistFmService.findSetlist({
          artistName: concert.artistName,
          city: concert.city,
          date: concert.date,
        })
      : null;

    return { ...concert, setlist };
  }
}
