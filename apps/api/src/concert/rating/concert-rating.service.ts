import { Injectable } from '@nestjs/common';
import type { ConcertRatingSummary } from '@reverb/shared';
import { PrismaService } from '../../prisma/prisma.service';

/** Gère la notation (1 à 5) d'un concert par un utilisateur, une note par personne (US-2.3). */
@Injectable()
export class ConcertRatingService {
  constructor(private readonly prisma: PrismaService) {}

  async rate(concertId: string, userId: string, value: number): Promise<void> {
    await this.prisma.concertRating.upsert({
      where: { userId_concertId: { userId, concertId } },
      create: { userId, concertId, value },
      update: { value },
    });
  }

  async getSummary(concertId: string): Promise<ConcertRatingSummary> {
    const aggregate = await this.prisma.concertRating.aggregate({
      where: { concertId },
      _avg: { value: true },
      _count: true,
    });

    return { average: aggregate._avg.value, count: aggregate._count };
  }
}
