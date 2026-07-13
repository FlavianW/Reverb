import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';
import { UserController } from './user.controller';
import { PublicUser, UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: {
    findByPseudo: jest.Mock;
    findAttendedConcerts: jest.Mock;
    updateProfile: jest.Mock;
  };

  const currentUser: PublicUser = {
    id: 'user-1',
    pseudo: 'ana-etoile',
    email: 'ana@example.com',
    avatarUrl: null,
    bio: null,
  };
  beforeEach(async () => {
    userService = {
      findByPseudo: jest.fn(),
      findAttendedConcerts: jest.fn(),
      updateProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();

    controller = module.get(UserController);
  });

  describe('getPublicProfile', () => {
    it("lève une 404 si l'utilisateur n'existe pas", async () => {
      userService.findByPseudo.mockResolvedValueOnce(null);

      await expect(controller.getPublicProfile('inconnu')).rejects.toThrow(
        NotFoundException,
      );
      expect(userService.findAttendedConcerts).not.toHaveBeenCalled();
    });

    it('renvoie le profil public sans email ni id, avec les concerts assistés', async () => {
      const user = {
        id: 'user-1',
        pseudo: 'ana-etoile',
        email: 'ana@example.com',
        bio: 'Fan de rock.',
        avatarUrl: 'https://example.com/avatar.png',
      } as User;
      userService.findByPseudo.mockResolvedValueOnce(user);
      const attendedConcerts = [{ id: 'concert-1', artistName: 'Muse' }];
      userService.findAttendedConcerts.mockResolvedValueOnce(attendedConcerts);

      const result = await controller.getPublicProfile('ana-etoile');

      expect(userService.findAttendedConcerts).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        pseudo: 'ana-etoile',
        bio: 'Fan de rock.',
        avatarUrl: 'https://example.com/avatar.png',
        attendedConcerts,
      });
    });
  });

  describe('updateMyProfile', () => {
    it('refuse si le nouveau pseudo est déjà pris par un autre compte', async () => {
      userService.findByPseudo.mockResolvedValueOnce({ id: 'other-user' });

      await expect(
        controller.updateMyProfile(
          { pseudo: 'pseudo-pris' },
          currentUser,
        ),
      ).rejects.toThrow(ConflictException);
      expect(userService.updateProfile).not.toHaveBeenCalled();
    });

    it("n'appelle pas findByPseudo si le pseudo ne change pas", async () => {
      const updated = { ...currentUser, bio: 'Fan de rock.' } as User;
      userService.updateProfile.mockResolvedValueOnce(updated);

      await controller.updateMyProfile(
        { pseudo: 'ana-etoile', bio: 'Fan de rock.' },
        currentUser,
      );

      expect(userService.findByPseudo).not.toHaveBeenCalled();
    });

    it('met à jour le profil et renvoie le profil public à jour', async () => {
      const updated = {
        id: 'user-1',
        pseudo: 'ana-etoile',
        email: 'ana@example.com',
        avatarUrl: null,
        bio: 'Fan de rock.',
      } as User;
      userService.updateProfile.mockResolvedValueOnce(updated);

      const result = await controller.updateMyProfile(
        { bio: 'Fan de rock.' },
        currentUser,
      );

      expect(userService.updateProfile).toHaveBeenCalledWith('user-1', {
        bio: 'Fan de rock.',
      });
      expect(result).toEqual({
        id: 'user-1',
        pseudo: 'ana-etoile',
        email: 'ana@example.com',
        avatarUrl: null,
        bio: 'Fan de rock.',
      });
    });
  });
});
