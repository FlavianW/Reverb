import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';
import { Request } from 'express';
import { GoogleProfile, UserService } from '../user/user.service';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let userService: { findOrCreateFromGoogleProfile: jest.Mock };

  const googleProfile: GoogleProfile = {
    googleId: 'google-123',
    email: 'ana@example.com',
    displayName: 'Ana Étoile',
    avatarUrl: 'https://example.com/avatar.png',
  };

  beforeEach(async () => {
    userService = { findOrCreateFromGoogleProfile: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();

    controller = module.get(AuthController);
  });

  describe('googleCallback', () => {
    it('crée ou récupère le compte à partir du profil Google et renvoie sa forme publique', async () => {
      const user = {
        id: 'user-1',
        pseudo: 'ana-etoile',
        email: googleProfile.email,
        avatarUrl: googleProfile.avatarUrl,
        googleId: googleProfile.googleId,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;
      userService.findOrCreateFromGoogleProfile.mockResolvedValueOnce(user);
      const req = { user: googleProfile } as unknown as Request;

      const result = await controller.googleCallback(req);

      expect(userService.findOrCreateFromGoogleProfile).toHaveBeenCalledWith(
        googleProfile,
      );
      expect(result).toEqual({
        id: 'user-1',
        pseudo: 'ana-etoile',
        email: googleProfile.email,
        avatarUrl: googleProfile.avatarUrl,
      });
    });
  });
});
