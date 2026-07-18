import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Gère les « J'aime » sur les posts (US-8.3). Contrairement à un signalement
 * (acte one-shot, doublon refusé en 409), un like se (dé)clique en continu :
 * `like`/`unlike` sont donc idempotents plutôt que de lever une erreur sur
 * un doublon ou une absence.
 */
@Injectable()
export class LikeService {
  constructor(private readonly prisma: PrismaService) {}

  async like(postId: string, userId: string): Promise<void> {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post introuvable.');
    }

    await this.prisma.like.upsert({
      where: { userId_postId: { userId, postId } },
      create: { userId, postId },
      update: {},
    });
  }

  async unlike(postId: string, userId: string): Promise<void> {
    await this.prisma.like.deleteMany({ where: { postId, userId } });
  }
}
