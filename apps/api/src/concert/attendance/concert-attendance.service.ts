import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** Gère le statut « J'y étais » d'un utilisateur sur un concert (US-2.2). */
@Injectable()
export class ConcertAttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async markAttended(concertId: string, userId: string): Promise<void> {
    await this.prisma.concertAttendance.upsert({
      where: { userId_concertId: { userId, concertId } },
      create: { userId, concertId },
      update: {},
    });
  }

  async unmarkAttended(concertId: string, userId: string): Promise<void> {
    await this.prisma.concertAttendance.deleteMany({
      where: { userId, concertId },
    });
  }

  async isAttendedBy(concertId: string, userId: string): Promise<boolean> {
    const attendance = await this.prisma.concertAttendance.findUnique({
      where: { userId_concertId: { userId, concertId } },
    });
    return attendance !== null;
  }
}
