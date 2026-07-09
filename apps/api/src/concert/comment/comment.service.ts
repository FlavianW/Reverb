import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Comment } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Commentaire tel qu'exposé au client, avec le pseudo de son auteur. */
export interface CommentSummary {
  id: string;
  content: string;
  pseudo: string;
  createdAt: Date;
}

/**
 * Gère les commentaires d'un concert (US-2.4). La suppression est réservée
 * à l'auteur du commentaire.
 */
@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  create(concertId: string, userId: string, content: string): Promise<Comment> {
    return this.prisma.comment.create({
      data: { concertId, userId, content },
    });
  }

  async delete(commentId: string, userId: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('Commentaire introuvable.');
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException(
        "Seul l'auteur peut supprimer ce commentaire.",
      );
    }

    await this.prisma.comment.delete({ where: { id: commentId } });
  }

  async findByConcert(concertId: string): Promise<CommentSummary[]> {
    const comments = await this.prisma.comment.findMany({
      where: { concertId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { pseudo: true } } },
    });

    return comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      pseudo: comment.user.pseudo,
      createdAt: comment.createdAt,
    }));
  }
}
