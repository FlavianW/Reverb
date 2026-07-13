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

    return this.createIfNotDuplicate(
      { commentId, reporterId, reason },
      'Vous avez déjà signalé ce commentaire.',
    );
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

    return this.createIfNotDuplicate(
      { photoId, reporterId, reason },
      'Vous avez déjà signalé cette photo.',
    );
  }

  private async createIfNotDuplicate(
    data: {
      reporterId: string;
      reason: ReportReason;
      commentId?: string;
      photoId?: string;
    },
    duplicateMessage: string,
  ): Promise<Report> {
    const alreadyReported = await this.prisma.report.findFirst({
      where: {
        reporterId: data.reporterId,
        commentId: data.commentId,
        photoId: data.photoId,
      },
    });
    if (alreadyReported) {
      throw new ConflictException(duplicateMessage);
    }

    return this.prisma.report.create({ data });
  }
}
