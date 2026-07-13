import {
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from '../../media/s3.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PhotoService } from './photo.service';

describe('PhotoService', () => {
  let service: PhotoService;
  let prisma: {
    photo: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
  };
  let s3Service: { uploadObject: jest.Mock; deleteObject: jest.Mock };

  const fakeFile = {
    buffer: Buffer.from('fake-image-content'),
    mimetype: 'image/jpeg',
    originalname: 'concert.jpg',
    size: 1024,
  } as Express.Multer.File;

  beforeEach(async () => {
    prisma = {
      photo: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };
    s3Service = { uploadObject: jest.fn(), deleteObject: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotoService,
        { provide: PrismaService, useValue: prisma },
        { provide: S3Service, useValue: s3Service },
      ],
    }).compile();

    service = module.get(PhotoService);
  });

  describe('uploadForConcert', () => {
    it("dépose le fichier sur S3 puis persiste la photo avec le pseudo de l'auteur", async () => {
      s3Service.uploadObject.mockResolvedValueOnce(
        'https://example.com/reverb-media/concerts/concert-1/a.jpg',
      );
      const createdAt = new Date();
      prisma.photo.create.mockResolvedValueOnce({
        id: 'photo-1',
        url: 'https://example.com/reverb-media/concerts/concert-1/a.jpg',
        uploadedBy: { pseudo: 'ana-etoile' },
        createdAt,
      });

      const result = await service.uploadForConcert(
        'concert-1',
        'user-1',
        fakeFile,
      );

      expect(s3Service.uploadObject).toHaveBeenCalledWith(
        expect.stringMatching(/^concerts\/concert-1\/.+\.jpg$/),
        fakeFile.buffer,
        'image/jpeg',
      );
      expect(prisma.photo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            concertId: 'concert-1',
            uploadedById: 'user-1',
            url: 'https://example.com/reverb-media/concerts/concert-1/a.jpg',
          }),
        }),
      );
      expect(result).toEqual({
        id: 'photo-1',
        url: 'https://example.com/reverb-media/concerts/concert-1/a.jpg',
        pseudo: 'ana-etoile',
        createdAt,
      });
    });

    it("signale une indisponibilité du stockage si l'upload S3 échoue, sans créer de photo orpheline", async () => {
      s3Service.uploadObject.mockRejectedValueOnce(new Error('S3 down'));

      await expect(
        service.uploadForConcert('concert-1', 'user-1', fakeFile),
      ).rejects.toThrow(ServiceUnavailableException);
      expect(prisma.photo.create).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it("lève une 404 si la photo n'existe pas", async () => {
      prisma.photo.findUnique.mockResolvedValueOnce(null);

      await expect(service.delete('photo-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.photo.delete).not.toHaveBeenCalled();
    });

    it("refuse la suppression si l'utilisateur n'est pas l'auteur", async () => {
      prisma.photo.findUnique.mockResolvedValueOnce({
        id: 'photo-1',
        key: 'concerts/concert-1/a.jpg',
        uploadedById: 'other-user',
      });

      await expect(service.delete('photo-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.photo.delete).not.toHaveBeenCalled();
    });

    it("supprime l'objet S3 puis la photo quand l'utilisateur en est l'auteur", async () => {
      prisma.photo.findUnique.mockResolvedValueOnce({
        id: 'photo-1',
        key: 'concerts/concert-1/a.jpg',
        uploadedById: 'user-1',
      });

      await service.delete('photo-1', 'user-1');

      expect(s3Service.deleteObject).toHaveBeenCalledWith(
        'concerts/concert-1/a.jpg',
      );
      expect(prisma.photo.delete).toHaveBeenCalledWith({
        where: { id: 'photo-1' },
      });
    });
  });

  describe('findByConcert', () => {
    it('renvoie les photos du plus récent au plus ancien, avec le pseudo de leur auteur', async () => {
      const createdAt = new Date();
      prisma.photo.findMany.mockResolvedValueOnce([
        {
          id: 'photo-1',
          url: 'https://example.com/a.jpg',
          uploadedBy: { pseudo: 'ana-etoile' },
          createdAt,
        },
      ]);

      const result = await service.findByConcert('concert-1');

      expect(prisma.photo.findMany).toHaveBeenCalledWith({
        where: { concertId: 'concert-1' },
        orderBy: { createdAt: 'desc' },
        include: { uploadedBy: { select: { pseudo: true } } },
      });
      expect(result).toEqual([
        {
          id: 'photo-1',
          url: 'https://example.com/a.jpg',
          pseudo: 'ana-etoile',
          createdAt,
        },
      ]);
    });
  });
});
