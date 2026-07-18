import { Injectable } from '@nestjs/common';
import { PostService } from '../../post/post.service';
import { PrismaService } from '../../prisma/prisma.service';

/** Gère le statut « J'y étais » d'un utilisateur sur un concert (US-2.2). */
@Injectable()
export class ConcertAttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postService: PostService,
  ) {}

  /**
   * `findUnique` + écriture en transaction : comme pour la notation, un post
   * (US-8.1) n'est généré qu'à la toute première déclaration de présence, pas
   * à chaque re-marquage.
   */
  async markAttended(concertId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.concertAttendance.findUnique({
        where: { userId_concertId: { userId, concertId } },
      });

      await tx.concertAttendance.upsert({
        where: { userId_concertId: { userId, concertId } },
        create: { userId, concertId },
        update: {},
      });

      if (!existing) {
        await this.postService.createAttendancePost(tx, concertId, userId);
      }
    });
  }

  async unmarkAttended(concertId: string, userId: string): Promise<void> {
    await this.prisma.concertAttendance.deleteMany({
      where: { userId, concertId },
    });
    await this.postService.deleteAttendancePost(concertId, userId);
  }

  async isAttendedBy(concertId: string, userId: string): Promise<boolean> {
    const attendance = await this.prisma.concertAttendance.findUnique({
      where: { userId_concertId: { userId, concertId } },
    });
    return attendance !== null;
  }
}
