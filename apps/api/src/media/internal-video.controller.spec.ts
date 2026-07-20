import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { InternalVideoController } from './internal-video.controller';
import { S3Service } from './s3.service';

describe('InternalVideoController', () => {
  let controller: InternalVideoController;
  let prisma: { video: { update: jest.Mock } };
  let s3Service: { publicUrl: jest.Mock };

  beforeEach(async () => {
    prisma = { video: { update: jest.fn() } };
    s3Service = {
      publicUrl: jest.fn((key: string) => `https://cdn.example.com/${key}`),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InternalVideoController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: S3Service, useValue: s3Service },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('secret') },
        },
      ],
    }).compile();

    controller = module.get(InternalVideoController);
  });

  describe('complete', () => {
    it('marque la vidéo READY avec les URLs résolues depuis les clés reçues', async () => {
      prisma.video.update.mockResolvedValueOnce({});

      await controller.complete('video-1', {
        playbackKey: 'posts/post-1/playback.mp4',
        posterKey: 'posts/post-1/poster.jpg',
        durationSeconds: 42,
      });

      expect(prisma.video.update).toHaveBeenCalledWith({
        where: { id: 'video-1' },
        data: {
          status: 'READY',
          playbackKey: 'posts/post-1/playback.mp4',
          playbackUrl: 'https://cdn.example.com/posts/post-1/playback.mp4',
          posterKey: 'posts/post-1/poster.jpg',
          posterUrl: 'https://cdn.example.com/posts/post-1/poster.jpg',
          durationSeconds: 42,
        },
      });
    });

    it("lève une 404 si la vidéo n'existe pas", async () => {
      prisma.video.update.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('introuvable', {
          code: 'P2025',
          clientVersion: 'test',
        }),
      );

      await expect(
        controller.complete('video-1', {
          playbackKey: 'posts/post-1/playback.mp4',
          posterKey: 'posts/post-1/poster.jpg',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('fail', () => {
    it('marque la vidéo FAILED', async () => {
      prisma.video.update.mockResolvedValueOnce({});

      await controller.fail('video-1');

      expect(prisma.video.update).toHaveBeenCalledWith({
        where: { id: 'video-1' },
        data: { status: 'FAILED' },
      });
    });
  });
});
