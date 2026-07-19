import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';
import type { PublicUser } from '@reverb/shared';
import { PostService } from '../post/post.service';
import { ProfileImageService } from './profile-image.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: {
    findByPseudo: jest.Mock;
    findAttendedConcerts: jest.Mock;
    updateProfile: jest.Mock;
    getPublicProfile: jest.Mock;
  };
  let profileImageService: { uploadForUser: jest.Mock };
  let postService: { getByAuthorId: jest.Mock };

  const currentUser: PublicUser = {
    id: 'user-1',
    pseudo: 'ana-etoile',
    email: 'ana@example.com',
    avatarUrl: null,
    bannerUrl: null,
    bio: null,
    favoriteArtist: null,
  };
  beforeEach(async () => {
    userService = {
      findByPseudo: jest.fn(),
      findAttendedConcerts: jest.fn(),
      updateProfile: jest.fn(),
      getPublicProfile: jest.fn(),
    };
    profileImageService = { uploadForUser: jest.fn() };
    postService = { getByAuthorId: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: ProfileImageService, useValue: profileImageService },
        { provide: PostService, useValue: postService },
      ],
    }).compile();

    controller = module.get(UserController);
  });

  describe('getPublicProfile', () => {
    it("lève une 404 si l'utilisateur n'existe pas", async () => {
      userService.getPublicProfile.mockResolvedValueOnce(null);

      await expect(controller.getPublicProfile('inconnu')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('renvoie le profil public résolu par le service', async () => {
      const attendedConcerts = [{ id: 'concert-1', artistName: 'Muse' }];
      const profile = {
        pseudo: 'ana-etoile',
        bio: 'Fan de rock.',
        avatarUrl: 'https://example.com/avatar.png',
        bannerUrl: 'https://example.com/banner.png',
        favoriteArtist: 'Muse',
        favoriteArtistImageUrl: 'https://example.com/muse.jpg',
        attendedConcerts,
      };
      userService.getPublicProfile.mockResolvedValueOnce(profile);

      const result = await controller.getPublicProfile('ana-etoile');

      expect(userService.getPublicProfile).toHaveBeenCalledWith('ana-etoile');
      expect(result).toBe(profile);
    });
  });

  describe('updateMyProfile', () => {
    it('refuse si le nouveau pseudo est déjà pris par un autre compte', async () => {
      userService.findByPseudo.mockResolvedValueOnce({ id: 'other-user' });

      await expect(
        controller.updateMyProfile({ pseudo: 'pseudo-pris' }, currentUser),
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
        bannerUrl: null,
        bio: 'Fan de rock.',
        favoriteArtist: null,
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
        bannerUrl: null,
        bio: 'Fan de rock.',
        favoriteArtist: null,
      });
    });
  });

  describe('getPosts', () => {
    it("lève une 404 si l'utilisateur n'existe pas", async () => {
      userService.findByPseudo.mockResolvedValueOnce(null);

      await expect(
        controller.getPosts('inconnu', {}, currentUser),
      ).rejects.toThrow(NotFoundException);
      expect(postService.getByAuthorId).not.toHaveBeenCalled();
    });

    it("délègue à PostService avec l'id de l'auteur et du visiteur", async () => {
      userService.findByPseudo.mockResolvedValueOnce({ id: 'author-1' });
      const page = { items: [], nextCursor: null };
      postService.getByAuthorId.mockResolvedValueOnce(page);

      const result = await controller.getPosts(
        'ana-etoile',
        { cursor: 'c1', take: 10 },
        currentUser,
      );

      expect(postService.getByAuthorId).toHaveBeenCalledWith(
        'author-1',
        'user-1',
        'c1',
        10,
      );
      expect(result).toBe(page);
    });
  });

  describe('uploadMyAvatar', () => {
    it("délègue l'upload au service avec l'id de l'utilisateur connecté", async () => {
      const file = { buffer: Buffer.from('img') } as Express.Multer.File;
      const updated: PublicUser = {
        ...currentUser,
        avatarUrl: 'https://example.com/avatar.jpg',
      };
      profileImageService.uploadForUser.mockResolvedValueOnce(updated);

      const result = await controller.uploadMyAvatar(file, currentUser);

      expect(profileImageService.uploadForUser).toHaveBeenCalledWith(
        'avatar',
        'user-1',
        file,
      );
      expect(result).toBe(updated);
    });
  });

  describe('uploadMyBanner', () => {
    it("délègue l'upload au service avec l'id de l'utilisateur connecté", async () => {
      const file = { buffer: Buffer.from('img') } as Express.Multer.File;
      const updated: PublicUser = {
        ...currentUser,
        bannerUrl: 'https://example.com/banner.jpg',
      };
      profileImageService.uploadForUser.mockResolvedValueOnce(updated);

      const result = await controller.uploadMyBanner(file, currentUser);

      expect(profileImageService.uploadForUser).toHaveBeenCalledWith(
        'banner',
        'user-1',
        file,
      );
      expect(result).toBe(updated);
    });
  });
});
