import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { LikeService } from './like.service';

describe('LikeService', () => {
  let service: LikeService;
  let prisma: {
    post: { findUnique: jest.Mock };
    like: { upsert: jest.Mock; deleteMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      post: { findUnique: jest.fn() },
      like: { upsert: jest.fn(), deleteMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [LikeService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(LikeService);
  });

  describe('like', () => {
    it("lève une 404 si le post n'existe pas", async () => {
      prisma.post.findUnique.mockResolvedValueOnce(null);

      await expect(service.like('post-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.like.upsert).not.toHaveBeenCalled();
    });

    it('est idempotent : liker deux fois ne lève pas (contrairement à un signalement)', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'post-1' });

      await service.like('post-1', 'user-1');
      await service.like('post-1', 'user-1');

      expect(prisma.like.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.like.upsert).toHaveBeenCalledWith({
        where: { userId_postId: { userId: 'user-1', postId: 'post-1' } },
        create: { userId: 'user-1', postId: 'post-1' },
        update: {},
      });
    });
  });

  describe('unlike', () => {
    it("ne lève pas si le like n'existait pas", async () => {
      await expect(service.unlike('post-1', 'user-1')).resolves.toBeUndefined();

      expect(prisma.like.deleteMany).toHaveBeenCalledWith({
        where: { postId: 'post-1', userId: 'user-1' },
      });
    });
  });
});
