import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';
import { S3Service } from '../../media/s3.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BannerService } from './banner.service';

describe('BannerService', () => {
  let service: BannerService;
  let prisma: { user: { update: jest.Mock } };
  let s3Service: { uploadObject: jest.Mock };

  const fakeFile = {
    buffer: Buffer.from('fake-image-content'),
    mimetype: 'image/jpeg',
    originalname: 'banner.jpg',
    size: 1024,
  } as Express.Multer.File;

  beforeEach(async () => {
    prisma = { user: { update: jest.fn() } };
    s3Service = { uploadObject: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BannerService,
        { provide: PrismaService, useValue: prisma },
        { provide: S3Service, useValue: s3Service },
      ],
    }).compile();

    service = module.get(BannerService);
  });

  describe('uploadForUser', () => {
    it("dépose le fichier sur S3 puis met à jour la bannière de l'utilisateur", async () => {
      s3Service.uploadObject.mockResolvedValueOnce(
        'https://example.com/reverb-media/banners/user-1/a.jpg',
      );
      const updated = {
        id: 'user-1',
        pseudo: 'ana-etoile',
        email: 'ana@example.com',
        avatarUrl: null,
        bannerUrl: 'https://example.com/reverb-media/banners/user-1/a.jpg',
        bio: null,
        favoriteArtist: null,
      } as User;
      prisma.user.update.mockResolvedValueOnce(updated);

      const result = await service.uploadForUser('user-1', fakeFile);

      expect(s3Service.uploadObject).toHaveBeenCalledWith(
        expect.stringMatching(/^banners\/user-1\/.+\.jpg$/),
        fakeFile.buffer,
        'image/jpeg',
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          bannerUrl: 'https://example.com/reverb-media/banners/user-1/a.jpg',
        },
      });
      expect(result).toEqual({
        id: 'user-1',
        pseudo: 'ana-etoile',
        email: 'ana@example.com',
        avatarUrl: null,
        bannerUrl: 'https://example.com/reverb-media/banners/user-1/a.jpg',
        bio: null,
        favoriteArtist: null,
      });
    });

    it("signale une indisponibilité du stockage si l'upload S3 échoue, sans modifier le profil", async () => {
      s3Service.uploadObject.mockRejectedValueOnce(new Error('S3 down'));

      await expect(service.uploadForUser('user-1', fakeFile)).rejects.toThrow(
        ServiceUnavailableException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
