import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';
import { S3Service } from '../media/s3.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileImageService } from './profile-image.service';

describe('ProfileImageService', () => {
  let service: ProfileImageService;
  let prisma: { user: { update: jest.Mock } };
  let s3Service: { uploadObject: jest.Mock };

  const fakeFile = {
    buffer: Buffer.from('fake-image-content'),
    mimetype: 'image/jpeg',
    originalname: 'image.jpg',
    size: 1024,
  } as Express.Multer.File;

  beforeEach(async () => {
    prisma = { user: { update: jest.fn() } };
    s3Service = { uploadObject: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileImageService,
        { provide: PrismaService, useValue: prisma },
        { provide: S3Service, useValue: s3Service },
      ],
    }).compile();

    service = module.get(ProfileImageService);
  });

  describe.each([
    ['avatar', 'avatars', 'avatarUrl'],
    ['banner', 'banners', 'bannerUrl'],
  ] as const)('uploadForUser (%s)', (kind, keyPrefix, column) => {
    it(`dépose le fichier sur S3 puis met à jour ${column}`, async () => {
      const url = `https://example.com/reverb-media/${keyPrefix}/user-1/a.jpg`;
      s3Service.uploadObject.mockResolvedValueOnce(url);
      const updated = {
        id: 'user-1',
        pseudo: 'ana-etoile',
        email: 'ana@example.com',
        avatarUrl: null,
        bannerUrl: null,
        bio: null,
        favoriteArtist: null,
        [column]: url,
      } as User;
      prisma.user.update.mockResolvedValueOnce(updated);

      const result = await service.uploadForUser(kind, 'user-1', fakeFile);

      expect(s3Service.uploadObject).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`^${keyPrefix}/user-1/.+\\.jpg$`)),
        fakeFile.buffer,
        'image/jpeg',
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { [column]: url },
      });
      expect(result).toEqual({
        id: 'user-1',
        pseudo: 'ana-etoile',
        email: 'ana@example.com',
        avatarUrl: kind === 'avatar' ? url : null,
        bannerUrl: kind === 'banner' ? url : null,
        bio: null,
        favoriteArtist: null,
      });
    });

    it("signale une indisponibilité du stockage si l'upload S3 échoue, sans modifier le profil", async () => {
      s3Service.uploadObject.mockRejectedValueOnce(new Error('S3 down'));

      await expect(
        service.uploadForUser(kind, 'user-1', fakeFile),
      ).rejects.toThrow(ServiceUnavailableException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
