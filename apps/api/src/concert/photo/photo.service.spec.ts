import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from '../../media/s3.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PhotoService } from './photo.service';

describe('PhotoService', () => {
  let service: PhotoService;
  let prisma: { photo: { create: jest.Mock; findMany: jest.Mock } };
  let s3Service: { uploadObject: jest.Mock };

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
      },
    };
    s3Service = { uploadObject: jest.fn() };

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
