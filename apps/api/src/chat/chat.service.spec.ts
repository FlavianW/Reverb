import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FriendshipService } from '../friendship/friendship.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: {
    conversation: {
      upsert: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    message: {
      findMany: jest.Mock;
      create: jest.Mock;
      count: jest.Mock;
    };
  };
  let userService: { findByPseudo: jest.Mock };
  let friendshipService: { areFriends: jest.Mock };

  const alice = { id: 'alice-id', pseudo: 'alice' };
  const bob = { id: 'bob-id', pseudo: 'bob' };

  const baseConversation = {
    id: 'conv-1',
    userAId: 'alice-id',
    userBId: 'bob-id',
    lastMessageAt: null,
    lastReadAtUserA: null,
    lastReadAtUserB: null,
    createdAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    prisma = {
      conversation: {
        upsert: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      message: {
        findMany: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
      },
    };
    userService = { findByPseudo: jest.fn() };
    friendshipService = { areFriends: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prisma },
        { provide: UserService, useValue: userService },
        { provide: FriendshipService, useValue: friendshipService },
      ],
    }).compile();

    service = module.get(ChatService);
  });

  describe('findOrCreateConversation', () => {
    it("lève une 404 si l'ami visé n'existe pas", async () => {
      userService.findByPseudo.mockResolvedValueOnce(null);

      await expect(
        service.findOrCreateConversation(alice.id, 'inconnu'),
      ).rejects.toThrow(NotFoundException);
      expect(friendshipService.areFriends).not.toHaveBeenCalled();
    });

    it('refuse si les deux comptes ne sont pas amis', async () => {
      userService.findByPseudo.mockResolvedValueOnce(bob);
      friendshipService.areFriends.mockResolvedValueOnce(false);

      await expect(
        service.findOrCreateConversation(alice.id, bob.pseudo),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.conversation.upsert).not.toHaveBeenCalled();
    });

    it("utilise une paire canonique identique quel que soit l'ordre des arguments", async () => {
      userService.findByPseudo.mockResolvedValueOnce(bob);
      friendshipService.areFriends.mockResolvedValueOnce(true);
      prisma.conversation.upsert.mockResolvedValueOnce({
        ...baseConversation,
        userA: { pseudo: 'alice', avatarUrl: null },
        userB: { pseudo: 'bob', avatarUrl: null },
        messages: [],
      });
      prisma.message.count.mockResolvedValueOnce(0);

      await service.findOrCreateConversation(alice.id, bob.pseudo);

      expect(prisma.conversation.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userAId_userBId: { userAId: 'alice-id', userBId: 'bob-id' },
          },
          create: { userAId: 'alice-id', userBId: 'bob-id' },
        }),
      );
    });

    it('renvoie un ConversationSummary avec le décompte de non-lus', async () => {
      userService.findByPseudo.mockResolvedValueOnce(bob);
      friendshipService.areFriends.mockResolvedValueOnce(true);
      prisma.conversation.upsert.mockResolvedValueOnce({
        ...baseConversation,
        userA: { pseudo: 'alice', avatarUrl: null },
        userB: { pseudo: 'bob', avatarUrl: null },
        messages: [],
      });
      prisma.message.count.mockResolvedValueOnce(3);

      const result = await service.findOrCreateConversation(
        alice.id,
        bob.pseudo,
      );

      expect(result).toEqual({
        id: 'conv-1',
        otherUser: { pseudo: 'bob', avatarUrl: null },
        lastMessage: null,
        unreadCount: 3,
        updatedAt: baseConversation.createdAt.toISOString(),
      });
    });
  });

  describe('getMessages', () => {
    it("refuse si la conversation n'existe pas", async () => {
      prisma.conversation.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.getMessages(alice.id, 'conv-1', undefined, 30),
      ).rejects.toThrow(NotFoundException);
    });

    it("refuse si l'appelant ne participe pas à la conversation", async () => {
      prisma.conversation.findUnique.mockResolvedValueOnce(baseConversation);

      await expect(
        service.getMessages('un-autre-id', 'conv-1', undefined, 30),
      ).rejects.toThrow(ForbiddenException);
    });

    it('renvoie les messages en ordre ascendant avec le bon nextCursor', async () => {
      prisma.conversation.findUnique.mockResolvedValueOnce(baseConversation);
      const makeMessage = (id: string, createdAt: Date) => ({
        id,
        conversationId: 'conv-1',
        senderId: alice.id,
        content: id,
        createdAt,
      });
      // findMany renvoie du plus récent au plus ancien (desc), take+1 pour
      // détecter hasMore : 3 messages renvoyés pour une page de 2.
      prisma.message.findMany.mockResolvedValueOnce([
        makeMessage('m3', new Date('2026-01-03')),
        makeMessage('m2', new Date('2026-01-02')),
        makeMessage('m1', new Date('2026-01-01')),
      ]);

      const result = await service.getMessages(
        alice.id,
        'conv-1',
        undefined,
        2,
      );

      expect(result.items.map((m) => m.id)).toEqual(['m2', 'm3']);
      expect(result.nextCursor).toBe('m2');
    });

    it("nextCursor est null s'il n'y a pas de page suivante", async () => {
      prisma.conversation.findUnique.mockResolvedValueOnce(baseConversation);
      prisma.message.findMany.mockResolvedValueOnce([
        {
          id: 'm1',
          conversationId: 'conv-1',
          senderId: alice.id,
          content: 'salut',
          createdAt: new Date('2026-01-01'),
        },
      ]);

      const result = await service.getMessages(
        alice.id,
        'conv-1',
        undefined,
        30,
      );

      expect(result.nextCursor).toBeNull();
    });
  });

  describe('sendMessage', () => {
    it("refuse si l'appelant ne participe pas à la conversation", async () => {
      prisma.conversation.findUnique.mockResolvedValueOnce(baseConversation);

      await expect(
        service.sendMessage('un-autre-id', 'conv-1', 'salut'),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.message.create).not.toHaveBeenCalled();
    });

    it('persiste le message et met à jour lastMessageAt de la conversation', async () => {
      prisma.conversation.findUnique.mockResolvedValueOnce(baseConversation);
      const created = {
        id: 'm1',
        conversationId: 'conv-1',
        senderId: alice.id,
        content: 'salut',
        createdAt: new Date('2026-01-05'),
      };
      prisma.message.create.mockResolvedValueOnce(created);

      const result = await service.sendMessage(alice.id, 'conv-1', 'salut');

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: 'conv-1',
          senderId: alice.id,
          content: 'salut',
        },
      });
      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { lastMessageAt: created.createdAt },
      });
      expect(result).toEqual({
        id: 'm1',
        conversationId: 'conv-1',
        senderId: alice.id,
        content: 'salut',
        createdAt: created.createdAt.toISOString(),
      });
    });
  });

  describe('markRead', () => {
    it("met à jour lastReadAtUserA quand l'appelant est userA", async () => {
      prisma.conversation.findUnique.mockResolvedValueOnce(baseConversation);

      await service.markRead(alice.id, 'conv-1');

      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { lastReadAtUserA: expect.any(Date) },
      });
    });

    it("met à jour lastReadAtUserB quand l'appelant est userB", async () => {
      prisma.conversation.findUnique.mockResolvedValueOnce(baseConversation);

      await service.markRead(bob.id, 'conv-1');

      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { lastReadAtUserB: expect.any(Date) },
      });
    });
  });
});
