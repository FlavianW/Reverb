import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Report, ReportReason } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Gère les signalements de contenu (US-6.1). Le traitement par un modérateur
 * est hors périmètre MVP : seul l'enregistrement est couvert.
 */
@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async reportComment(
    commentId: string,
    reporterId: string,
    reason: ReportReason,
  ): Promise<Report> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('Commentaire introuvable.');
    }

    const alreadyReported = await this.prisma.report.findFirst({
      where: { commentId, reporterId },
    });
    if (alreadyReported) {
      throw new ConflictException('Vous avez déjà signalé ce commentaire.');
    }

    return this.prisma.report.create({
      data: { commentId, reporterId, reason },
    });
  }

  async reportPhoto(
    photoId: string,
    reporterId: string,
    reason: ReportReason,
  ): Promise<Report> {
    const photo = await this.prisma.photo.findUnique({
      where: { id: photoId },
    });
    if (!photo) {
      throw new NotFoundException('Photo introuvable.');
    }

    const alreadyReported = await this.prisma.report.findFirst({
      where: { photoId, reporterId },
    });
    if (alreadyReported) {
      throw new ConflictException('Vous avez déjà signalé cette photo.');
    }

    return this.prisma.report.create({ data: { photoId, reporterId, reason } });
  }
}
