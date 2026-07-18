import { Injectable } from '@nestjs/common';
import type { ConcertRatingSummary } from '@reverb/shared';
import { PostService } from '../../post/post.service';
import { PrismaService } from '../../prisma/prisma.service';

/** Gère la notation (1 à 5) d'un concert par un utilisateur, une note par personne (US-2.3). */
@Injectable()
export class ConcertRatingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postService: PostService,
  ) {}

  /**
   * `findUnique` + écriture dans une transaction interactive : nécessaire
   * pour distinguer create/update de l'upsert (Prisma ne le renvoie pas) sans
   * fenêtre de course, afin de ne générer un post dans le fil (US-8.1) qu'à la
   * toute première notation — une re-notation ne doit pas spammer le fil.
   */
  async rate(concertId: string, userId: string, value: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.concertRating.findUnique({
        where: { userId_concertId: { userId, concertId } },
      });

      await tx.concertRating.upsert({
        where: { userId_concertId: { userId, concertId } },
        create: { userId, concertId, value },
        update: { value },
      });

      if (!existing) {
        await this.postService.createRatingPost(tx, concertId, userId, value);
      }
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
