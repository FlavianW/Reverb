import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import type { PublicUser } from '../../user/user.service';
import { PhotoController } from './photo.controller';
import { PhotoService } from './photo.service';

describe('PhotoController', () => {
  let controller: PhotoController;
  let photoService: { delete: jest.Mock };

  const currentUser: PublicUser = {
    id: 'user-1',
    pseudo: 'ana-etoile',
    email: 'ana@example.com',
    avatarUrl: null,
    bio: null,
  };
  const requestAsCurrentUser = { user: currentUser } as unknown as Request;

  beforeEach(async () => {
    photoService = { delete: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PhotoController],
      providers: [{ provide: PhotoService, useValue: photoService }],
    }).compile();

    controller = module.get(PhotoController);
  });

  describe('delete', () => {
    it("délègue la suppression au service avec l'id de l'utilisateur connecté", async () => {
      await controller.delete('photo-1', requestAsCurrentUser);

      expect(photoService.delete).toHaveBeenCalledWith('photo-1', 'user-1');
    });
  });
});
