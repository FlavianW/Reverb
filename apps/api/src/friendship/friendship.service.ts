import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Friendship, User } from '@prisma/client';
import type {
  FriendshipOverview,
  FriendshipStatusWithUser,
  FriendshipSummary,
} from '@reverb/shared';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';

type FriendshipWithUsers = Friendship & { requester: User; addressee: User };

/**
 * Gère les relations d'amitié à validation mutuelle (US-7.1). Une demande
 * envoyée alors qu'une demande inverse est déjà en attente est acceptée
 * automatiquement plutôt que de créer un doublon symétrique.
 */
@Injectable()
export class FriendshipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async sendRequest(
    requesterId: string,
    addresseePseudo: string,
  ): Promise<FriendshipSummary> {
    const addressee = await this.userService.findByPseudo(addresseePseudo);
    if (!addressee) {
      throw new NotFoundException('Utilisateur introuvable.');
    }
    if (addressee.id === requesterId) {
      throw new BadRequestException(
        'Vous ne pouvez pas vous ajouter vous-même.',
      );
    }

    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId: addressee.id },
          { requesterId: addressee.id, addresseeId: requesterId },
        ],
      },
      include: { requester: true, addressee: true },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        throw new ConflictException('Vous êtes déjà amis.');
      }
      if (existing.requesterId === requesterId) {
        throw new ConflictException('Demande déjà envoyée.');
      }

      // Demande inverse déjà en attente : on l'accepte au lieu de créer un
      // doublon symétrique.
      const accepted = await this.prisma.friendship.update({
        where: { id: existing.id },
        data: { status: 'ACCEPTED' },
        include: { requester: true, addressee: true },
      });
      return this.toSummary(accepted, requesterId);
    }

    const created = await this.prisma.friendship.create({
      data: { requesterId, addresseeId: addressee.id, status: 'PENDING' },
      include: { requester: true, addressee: true },
    });
    return this.toSummary(created, requesterId);
  }

  async accept(friendshipId: string, currentUserId: string): Promise<void> {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });
    if (!friendship) {
      throw new NotFoundException('Demande introuvable.');
    }
    if (friendship.addresseeId !== currentUserId) {
      throw new ForbiddenException(
        'Seul le destinataire peut accepter cette demande.',
      );
    }
    if (friendship.status === 'ACCEPTED') {
      throw new ConflictException('Cette demande a déjà été acceptée.');
    }

    await this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'ACCEPTED' },
    });
  }

  /**
   * Point d'entrée unique pour annuler une demande envoyée, refuser une
   * demande reçue, ou mettre fin à une amitié acceptée : les trois actions
   * reviennent à supprimer la ligne, seule l'autorisation diffère du contexte.
   */
  async remove(friendshipId: string, currentUserId: string): Promise<void> {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });
    if (!friendship) {
      throw new NotFoundException('Relation introuvable.');
    }
    if (
      friendship.requesterId !== currentUserId &&
      friendship.addresseeId !== currentUserId
    ) {
      throw new ForbiddenException(
        "Vous n'êtes pas concerné par cette relation.",
      );
    }

    await this.prisma.friendship.delete({ where: { id: friendshipId } });
  }

  async getOverview(userId: string): Promise<FriendshipOverview> {
    const rows = await this.prisma.friendship.findMany({
      where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
      include: { requester: true, addressee: true },
      orderBy: { createdAt: 'desc' },
    });

    const overview: FriendshipOverview = {
      friends: [],
      receivedRequests: [],
      sentRequests: [],
    };

    for (const row of rows) {
      const summary = this.toSummary(row, userId);
      if (row.status === 'ACCEPTED') {
        overview.friends.push(summary);
      } else if (row.addresseeId === userId) {
        overview.receivedRequests.push(summary);
      } else {
        overview.sentRequests.push(summary);
      }
    }

    return overview;
  }

  async getStatusWith(
    currentUserId: string,
    pseudo: string,
  ): Promise<FriendshipStatusWithUser> {
    const target = await this.userService.findByPseudo(pseudo);
    if (!target) {
      throw new NotFoundException('Utilisateur introuvable.');
    }
    if (target.id === currentUserId) {
      return { status: 'SELF', friendshipId: null };
    }

    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: currentUserId, addresseeId: target.id },
          { requesterId: target.id, addresseeId: currentUserId },
        ],
      },
    });

    if (!friendship) {
      return { status: 'NONE', friendshipId: null };
    }
    if (friendship.status === 'ACCEPTED') {
      return { status: 'FRIENDS', friendshipId: friendship.id };
    }
    return {
      status:
        friendship.requesterId === currentUserId
          ? 'PENDING_SENT'
          : 'PENDING_RECEIVED',
      friendshipId: friendship.id,
    };
  }

  private toSummary(
    friendship: FriendshipWithUsers,
    viewerId: string,
  ): FriendshipSummary {
    const other =
      friendship.requesterId === viewerId
        ? friendship.addressee
        : friendship.requester;

    return {
      id: friendship.id,
      status: friendship.status,
      createdAt: friendship.createdAt.toISOString(),
      user: { pseudo: other.pseudo, avatarUrl: other.avatarUrl },
    };
  }
}
