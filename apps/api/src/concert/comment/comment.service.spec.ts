import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Comment } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CommentService } from './comment.service';

describe('CommentService', () => {
  let service: CommentService;
  let prisma: {
    comment: {
      create: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      comment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CommentService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(CommentService);
  });

  describe('create', () => {
    it('crée un commentaire pour le concert et l’auteur donnés', async () => {
      await service.create('concert-1', 'user-1', 'Super concert !');

      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          concertId: 'concert-1',
          userId: 'user-1',
          content: 'Super concert !',
        },
      });
    });
  });

  describe('delete', () => {
    it("lève une 404 si le commentaire n'existe pas", async () => {
      prisma.comment.findUnique.mockResolvedValueOnce(null);

      await expect(service.delete('comment-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.comment.delete).not.toHaveBeenCalled();
    });

    it("refuse la suppression si l'utilisateur n'est pas l'auteur", async () => {
      prisma.comment.findUnique.mockResolvedValueOnce({
        id: 'comment-1',
        userId: 'other-user',
      });

      await expect(service.delete('comment-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.comment.delete).not.toHaveBeenCalled();
    });

    it("supprime le commentaire quand l'utilisateur en est l'auteur", async () => {
      prisma.comment.findUnique.mockResolvedValueOnce({
        id: 'comment-1',
        userId: 'user-1',
      });

      await service.delete('comment-1', 'user-1');

      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
      });
    });
  });

  describe('findByConcert', () => {
    it("expose le pseudo de l'auteur plutôt que son id", async () => {
      prisma.comment.findMany.mockResolvedValueOnce([
        {
          id: 'comment-1',
          content: 'Super concert !',
          createdAt: new Date('2024-01-01'),
          user: { pseudo: 'ana-etoile' },
        },
      ]);

      const result = await service.findByConcert('concert-1');

      expect(result).toEqual([
        {
          id: 'comment-1',
          content: 'Super concert !',
          pseudo: 'ana-etoile',
          createdAt: new Date('2024-01-01'),
        },
      ]);
    });
  });
});
