import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from '../../media/s3.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConcertVideoService } from './video.service';

describe('ConcertVideoService', () => {
  let service: ConcertVideoService;
  let prisma: {
    video: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
  };
  let s3Service: {
    createPresignedUpload: jest.Mock;
    headObject: jest.Mock;
    deleteObject: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      video: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };
    s3Service = {
      createPresignedUpload: jest.fn(),
      headObject: jest.fn(),
      deleteObject: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConcertVideoService,
        { provide: PrismaService, useValue: prisma },
        { provide: S3Service, useValue: s3Service },
      ],
    }).compile();

    service = module.get(ConcertVideoService);
  });

  describe('presignUpload', () => {
    it('refuse un type MIME non supporté', async () => {
      await expect(
        service.presignUpload('concert-1', 'video/webm'),
      ).rejects.toThrow(BadRequestException);
      expect(s3Service.createPresignedUpload).not.toHaveBeenCalled();
    });

    it('génère une clé sous le préfixe du concert avec la bonne extension', async () => {
      s3Service.createPresignedUpload.mockResolvedValueOnce({
        url: 'http://localhost:9000/reverb-media',
        fields: {},
      });

      const result = await service.presignUpload('concert-1', 'video/mp4');

      expect(result.key).toMatch(/^concerts\/concert-1\/.+\/original\.mp4$/);
      expect(s3Service.createPresignedUpload).toHaveBeenCalledWith(
        result.key,
        'video/mp4',
        expect.any(Number),
      );
    });
  });

  describe('confirmUpload', () => {
    it("refuse une clé qui n'appartient pas au concert", async () => {
      await expect(
        service.confirmUpload(
          'concert-1',
          'user-1',
          'concerts/autre-concert/x/original.mp4',
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(s3Service.headObject).not.toHaveBeenCalled();
    });

    it("refuse si l'objet n'a pas été trouvé dans le stockage", async () => {
      s3Service.headObject.mockResolvedValueOnce(false);

      await expect(
        service.confirmUpload(
          'concert-1',
          'user-1',
          'concerts/concert-1/x/original.mp4',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.video.create).not.toHaveBeenCalled();
    });

    it('crée la ligne vidéo en statut PROCESSING quand tout est valide', async () => {
      s3Service.headObject.mockResolvedValueOnce(true);
      prisma.video.create.mockResolvedValueOnce({
        id: 'video-1',
        status: 'PROCESSING',
        playbackUrl: null,
        posterUrl: null,
        durationSeconds: null,
        createdAt: new Date('2026-01-01'),
        uploadedBy: { pseudo: 'ana-etoile' },
      });

      const result = await service.confirmUpload(
        'concert-1',
        'user-1',
        'concerts/concert-1/x/original.mp4',
      );

      expect(prisma.video.create).toHaveBeenCalledWith({
        data: {
          key: 'concerts/concert-1/x/original.mp4',
          concertId: 'concert-1',
          uploadedById: 'user-1',
        },
        include: { uploadedBy: { select: { pseudo: true } } },
      });
      expect(result.status).toBe('PROCESSING');
      expect(result.url).toBeNull();
    });
  });

  describe('delete', () => {
    it("lève une 404 si la vidéo n'existe pas", async () => {
      prisma.video.findUnique.mockResolvedValueOnce(null);

      await expect(service.delete('video-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('refuse de supprimer une vidéo attachée à un post via cette route', async () => {
      prisma.video.findUnique.mockResolvedValueOnce({
        id: 'video-1',
        postId: 'post-1',
        uploadedById: 'user-1',
      });

      await expect(service.delete('video-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(s3Service.deleteObject).not.toHaveBeenCalled();
    });

    it("refuse la suppression par un autre utilisateur que l'auteur", async () => {
      prisma.video.findUnique.mockResolvedValueOnce({
        id: 'video-1',
        postId: null,
        uploadedById: 'other-user',
      });

      await expect(service.delete('video-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('supprime la vidéo et ses objets S3 (original, rendu, vignette)', async () => {
      prisma.video.findUnique.mockResolvedValueOnce({
        id: 'video-1',
        postId: null,
        uploadedById: 'user-1',
        key: 'concerts/concert-1/x/original.mp4',
        playbackKey: 'concerts/concert-1/x/playback.mp4',
        posterKey: 'concerts/concert-1/x/poster.jpg',
      });

      await service.delete('video-1', 'user-1');

      expect(s3Service.deleteObject).toHaveBeenCalledWith(
        'concerts/concert-1/x/original.mp4',
      );
      expect(s3Service.deleteObject).toHaveBeenCalledWith(
        'concerts/concert-1/x/playback.mp4',
      );
      expect(s3Service.deleteObject).toHaveBeenCalledWith(
        'concerts/concert-1/x/poster.jpg',
      );
      expect(prisma.video.delete).toHaveBeenCalledWith({
        where: { id: 'video-1' },
      });
    });
  });
});
