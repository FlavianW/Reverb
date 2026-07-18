import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { FriendshipService } from './friendship.service';

describe('FriendshipService', () => {
  let service: FriendshipService;
  let prisma: {
    friendship: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let userService: { findByPseudo: jest.Mock };

  const alice = { id: 'alice-id', pseudo: 'alice', avatarUrl: null };
  const bob = { id: 'bob-id', pseudo: 'bob', avatarUrl: null };

  beforeEach(async () => {
    prisma = {
      friendship: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    userService = { findByPseudo: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendshipService,
        { provide: PrismaService, useValue: prisma },
        { provide: UserService, useValue: userService },
      ],
    }).compile();

    service = module.get(FriendshipService);
  });

  describe('sendRequest', () => {
    it('refuse une demande vers soi-même', async () => {
      userService.findByPseudo.mockResolvedValueOnce(alice);

      await expect(service.sendRequest(alice.id, 'alice')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.friendship.create).not.toHaveBeenCalled();
    });

    it("lève une 404 si le destinataire n'existe pas", async () => {
      userService.findByPseudo.mockResolvedValueOnce(null);

      await expect(service.sendRequest(alice.id, 'inconnu')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('refuse si les deux utilisateurs sont déjà amis', async () => {
      userService.findByPseudo.mockResolvedValueOnce(bob);
      prisma.friendship.findFirst.mockResolvedValueOnce({
        id: 'f1',
        requesterId: alice.id,
        addresseeId: bob.id,
        status: 'ACCEPTED',
        requester: alice,
        addressee: bob,
      });

      await expect(service.sendRequest(alice.id, 'bob')).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.friendship.update).not.toHaveBeenCalled();
    });

    it('refuse une demande déjà envoyée dans le même sens', async () => {
      userService.findByPseudo.mockResolvedValueOnce(bob);
      prisma.friendship.findFirst.mockResolvedValueOnce({
        id: 'f1',
        requesterId: alice.id,
        addresseeId: bob.id,
        status: 'PENDING',
        requester: alice,
        addressee: bob,
      });

      await expect(service.sendRequest(alice.id, 'bob')).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.friendship.update).not.toHaveBeenCalled();
    });

    it('accepte automatiquement une demande inverse en attente (symétrie)', async () => {
      userService.findByPseudo.mockResolvedValueOnce(bob);
      prisma.friendship.findFirst.mockResolvedValueOnce({
        id: 'f1',
        requesterId: bob.id,
        addresseeId: alice.id,
        status: 'PENDING',
        requester: bob,
        addressee: alice,
      });
      prisma.friendship.update.mockResolvedValueOnce({
        id: 'f1',
        requesterId: bob.id,
        addresseeId: alice.id,
        status: 'ACCEPTED',
        createdAt: new Date('2026-01-01'),
        requester: bob,
        addressee: alice,
      });

      const result = await service.sendRequest(alice.id, 'bob');

      expect(prisma.friendship.update).toHaveBeenCalledWith({
        where: { id: 'f1' },
        data: { status: 'ACCEPTED' },
        include: { requester: true, addressee: true },
      });
      expect(prisma.friendship.create).not.toHaveBeenCalled();
      expect(result.status).toBe('ACCEPTED');
      expect(result.user.pseudo).toBe('bob');
    });

    it("crée une demande PENDING si aucune relation n'existe", async () => {
      userService.findByPseudo.mockResolvedValueOnce(bob);
      prisma.friendship.findFirst.mockResolvedValueOnce(null);
      prisma.friendship.create.mockResolvedValueOnce({
        id: 'f2',
        requesterId: alice.id,
        addresseeId: bob.id,
        status: 'PENDING',
        createdAt: new Date('2026-01-01'),
        requester: alice,
        addressee: bob,
      });

      const result = await service.sendRequest(alice.id, 'bob');

      expect(prisma.friendship.create).toHaveBeenCalledWith({
        data: { requesterId: alice.id, addresseeId: bob.id, status: 'PENDING' },
        include: { requester: true, addressee: true },
      });
      expect(result.status).toBe('PENDING');
    });
  });

  describe('accept', () => {
    it("lève une 404 si la demande n'existe pas", async () => {
      prisma.friendship.findUnique.mockResolvedValueOnce(null);

      await expect(service.accept('f1', alice.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("refuse si l'appelant n'est pas le destinataire", async () => {
      prisma.friendship.findUnique.mockResolvedValueOnce({
        id: 'f1',
        requesterId: alice.id,
        addresseeId: bob.id,
        status: 'PENDING',
      });

      await expect(service.accept('f1', 'un-tiers')).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.friendship.update).not.toHaveBeenCalled();
    });

    it('refuse si la demande est déjà acceptée', async () => {
      prisma.friendship.findUnique.mockResolvedValueOnce({
        id: 'f1',
        requesterId: alice.id,
        addresseeId: bob.id,
        status: 'ACCEPTED',
      });

      await expect(service.accept('f1', bob.id)).rejects.toThrow(
        ConflictException,
      );
    });

    it('accepte la demande', async () => {
      prisma.friendship.findUnique.mockResolvedValueOnce({
        id: 'f1',
        requesterId: alice.id,
        addresseeId: bob.id,
        status: 'PENDING',
      });

      await service.accept('f1', bob.id);

      expect(prisma.friendship.update).toHaveBeenCalledWith({
        where: { id: 'f1' },
        data: { status: 'ACCEPTED' },
      });
    });
  });

  describe('remove', () => {
    it("lève une 404 si la relation n'existe pas", async () => {
      prisma.friendship.findUnique.mockResolvedValueOnce(null);

      await expect(service.remove('f1', alice.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("refuse si l'appelant n'est ni requester ni addressee", async () => {
      prisma.friendship.findUnique.mockResolvedValueOnce({
        id: 'f1',
        requesterId: alice.id,
        addresseeId: bob.id,
        status: 'ACCEPTED',
      });

      await expect(service.remove('f1', 'un-tiers')).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.friendship.delete).not.toHaveBeenCalled();
    });

    it("supprime la relation pour le requester ou l'addressee", async () => {
      prisma.friendship.findUnique.mockResolvedValueOnce({
        id: 'f1',
        requesterId: alice.id,
        addresseeId: bob.id,
        status: 'ACCEPTED',
      });

      await service.remove('f1', bob.id);

      expect(prisma.friendship.delete).toHaveBeenCalledWith({
        where: { id: 'f1' },
      });
    });
  });

  describe('getStatusWith', () => {
    it('renvoie SELF pour son propre pseudo', async () => {
      userService.findByPseudo.mockResolvedValueOnce(alice);

      const result = await service.getStatusWith(alice.id, 'alice');

      expect(result).toEqual({ status: 'SELF', friendshipId: null });
    });

    it("renvoie NONE si aucune relation n'existe", async () => {
      userService.findByPseudo.mockResolvedValueOnce(bob);
      prisma.friendship.findFirst.mockResolvedValueOnce(null);

      const result = await service.getStatusWith(alice.id, 'bob');

      expect(result).toEqual({ status: 'NONE', friendshipId: null });
    });

    it('renvoie PENDING_SENT si la demande a été envoyée par le viewer', async () => {
      userService.findByPseudo.mockResolvedValueOnce(bob);
      prisma.friendship.findFirst.mockResolvedValueOnce({
        id: 'f1',
        requesterId: alice.id,
        addresseeId: bob.id,
        status: 'PENDING',
      });

      const result = await service.getStatusWith(alice.id, 'bob');

      expect(result).toEqual({ status: 'PENDING_SENT', friendshipId: 'f1' });
    });
  });

  describe('areFriends', () => {
    it('renvoie true si les comptes sont amis, quel que soit le sens', async () => {
      prisma.friendship.findFirst.mockResolvedValueOnce({
        id: 'f1',
        requesterId: alice.id,
        addresseeId: bob.id,
        status: 'ACCEPTED',
      });

      const result = await service.areFriends(bob.id, alice.id);

      expect(result).toBe(true);
      expect(prisma.friendship.findFirst).toHaveBeenCalledWith({
        where: {
          status: 'ACCEPTED',
          OR: [
            { requesterId: bob.id, addresseeId: alice.id },
            { requesterId: alice.id, addresseeId: bob.id },
          ],
        },
      });
    });

    it("renvoie false si la relation n'est pas ACCEPTED (ou n'existe pas)", async () => {
      // Le filtre status: 'ACCEPTED' de la requête exclut déjà une relation
      // PENDING : le mock renvoie null dans les deux cas (absence ou pending).
      prisma.friendship.findFirst.mockResolvedValueOnce(null);

      const result = await service.areFriends(alice.id, bob.id);

      expect(result).toBe(false);
    });
  });
});
