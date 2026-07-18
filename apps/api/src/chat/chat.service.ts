import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Conversation, Message, Prisma } from '@prisma/client';
import type {
  ConversationSummary,
  MessagePage,
  MessageSummary,
} from '@reverb/shared';
import { FriendshipService } from '../friendship/friendship.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';

const CONVERSATION_INCLUDE = {
  userA: { select: { pseudo: true, avatarUrl: true } },
  userB: { select: { pseudo: true, avatarUrl: true } },
  messages: {
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 1,
  },
} satisfies Prisma.ConversationInclude;

type ConversationWithRelations = Conversation & {
  userA: { pseudo: string; avatarUrl: string | null };
  userB: { pseudo: string; avatarUrl: string | null };
  messages: Message[];
};

/**
 * Gère les conversations privées 1-à-1 entre amis et leurs messages (US-10.x).
 * Réservé aux amitiés mutuelles acceptées (`FriendshipService.areFriends`).
 * La persistance d'un message est indépendante de sa diffusion temps réel :
 * `sendMessage` ne persiste que, `ChatController`/`ChatGateway` appellent
 * ensuite `ChatGateway.emitMessageToConversation` séparément.
 */
@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly friendshipService: FriendshipService,
  ) {}

  /** Retrouve la conversation avec cet ami ou la crée (US-10.1). */
  async findOrCreateConversation(
    currentUserId: string,
    friendPseudo: string,
  ): Promise<ConversationSummary> {
    const target = await this.userService.findByPseudo(friendPseudo);
    if (!target) {
      throw new NotFoundException('Utilisateur introuvable.');
    }
    if (!(await this.friendshipService.areFriends(currentUserId, target.id))) {
      throw new ForbiddenException(
        'Vous ne pouvez envoyer un message qu’à un ami.',
      );
    }

    // Paire canonique (le plus petit id en A) : une seule ligne par paire,
    // sans avoir à chercher dans les deux sens comme pour Friendship.
    const [userAId, userBId] = [currentUserId, target.id].sort();
    const conversation = await this.prisma.conversation.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      create: { userAId, userBId },
      update: {},
      include: CONVERSATION_INCLUDE,
    });

    return this.toSummary(conversation, currentUserId);
  }

  /** Conversations de l'utilisateur, la plus récemment active en premier (US-10.2). */
  async listConversations(userId: string): Promise<ConversationSummary[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: CONVERSATION_INCLUDE,
      orderBy: { lastMessageAt: 'desc' },
    });

    return Promise.all(
      conversations.map((conversation) => this.toSummary(conversation, userId)),
    );
  }

  /** Total des messages non lus, toutes conversations confondues (US-10.3). */
  async getUnreadCount(userId: string): Promise<number> {
    const conversations = await this.prisma.conversation.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
    });

    const counts = await Promise.all(
      conversations.map((conversation) =>
        this.countUnread(conversation, userId),
      ),
    );
    return counts.reduce((total, count) => total + count, 0);
  }

  /**
   * Historique d'une conversation, du plus ancien au plus récent (US-10.2).
   * Pagination inversée par rapport au fil : le curseur pointe vers des
   * messages plus anciens, à charger en remontant.
   */
  async getMessages(
    userId: string,
    conversationId: string,
    cursor: string | undefined,
    take = 30,
  ): Promise<MessagePage> {
    await this.assertParticipant(userId, conversationId);

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: take + 1,
    });

    const hasMore = messages.length > take;
    const page = messages.slice(0, take);

    return {
      items: page.map((message) => this.toMessageSummary(message)).reverse(),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }

  /** Persiste un message (US-10.1) ; la diffusion temps réel est faite par l'appelant. */
  async sendMessage(
    userId: string,
    conversationId: string,
    content: string,
  ): Promise<MessageSummary> {
    await this.assertParticipant(userId, conversationId);

    const message = await this.prisma.message.create({
      data: { conversationId, senderId: userId, content },
    });
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt },
    });

    return this.toMessageSummary(message);
  }

  /** Marque la conversation comme lue pour l'appelant (US-10.3). */
  async markRead(userId: string, conversationId: string): Promise<void> {
    const conversation = await this.assertParticipant(userId, conversationId);
    const field =
      conversation.userAId === userId ? 'lastReadAtUserA' : 'lastReadAtUserB';

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { [field]: new Date() },
    });
  }

  /**
   * Vérifie que l'utilisateur fait partie de la conversation ; la renvoie
   * sinon. Publique : réutilisée par `ChatGateway` pour valider `joinConversation`.
   */
  async assertParticipant(
    userId: string,
    conversationId: string,
  ): Promise<Conversation> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation introuvable.');
    }
    if (conversation.userAId !== userId && conversation.userBId !== userId) {
      throw new ForbiddenException(
        'Vous ne participez pas à cette conversation.',
      );
    }
    return conversation;
  }

  /**
   * Nombre de messages de l'autre participant reçus depuis la dernière
   * lecture de l'appelant (ses propres messages ne comptent jamais).
   */
  private async countUnread(
    conversation: Conversation,
    userId: string,
  ): Promise<number> {
    const lastReadAt =
      conversation.userAId === userId
        ? conversation.lastReadAtUserA
        : conversation.lastReadAtUserB;

    return this.prisma.message.count({
      where: {
        conversationId: conversation.id,
        senderId: { not: userId },
        ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
      },
    });
  }

  private async toSummary(
    conversation: ConversationWithRelations,
    viewerId: string,
  ): Promise<ConversationSummary> {
    const other =
      conversation.userAId === viewerId
        ? conversation.userB
        : conversation.userA;
    const lastMessage = conversation.messages[0];

    return {
      id: conversation.id,
      otherUser: { pseudo: other.pseudo, avatarUrl: other.avatarUrl },
      lastMessage: lastMessage ? this.toMessageSummary(lastMessage) : null,
      unreadCount: await this.countUnread(conversation, viewerId),
      updatedAt: (
        conversation.lastMessageAt ?? conversation.createdAt
      ).toISOString(),
    };
  }

  private toMessageSummary(message: Message): MessageSummary {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
