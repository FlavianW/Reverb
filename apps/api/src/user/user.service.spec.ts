import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleProfile, UserService, toPublicUser } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    concertAttendance: { findMany: jest.Mock };
  };

  const googleProfile: GoogleProfile = {
    googleId: 'google-123',
    email: 'ana@example.com',
    displayName: 'Ana Étoile',
    avatarUrl: 'https://example.com/avatar.png',
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      concertAttendance: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(UserService);
  });

  describe('findOrCreateFromGoogleProfile', () => {
    it("retourne le compte existant sans le recréer s'il est déjà lié à ce compte Google", async () => {
      const existingUser = {
        id: 'user-1',
        googleId: googleProfile.googleId,
      } as User;
      prisma.user.findUnique.mockResolvedValueOnce(existingUser);

      const result = await service.findOrCreateFromGoogleProfile(googleProfile);

      expect(result).toBe(existingUser);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('crée un compte avec un pseudo dérivé et sans accents à la première connexion', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(null) // pas de compte existant pour ce googleId
        .mockResolvedValueOnce(null); // le pseudo dérivé est libre
      const createdUser = { id: 'user-2' } as User;
      prisma.user.create.mockResolvedValueOnce(createdUser);

      const result = await service.findOrCreateFromGoogleProfile(googleProfile);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          googleId: googleProfile.googleId,
          email: googleProfile.email,
          pseudo: 'ana-etoile',
          avatarUrl: googleProfile.avatarUrl,
        },
      });
      expect(result).toBe(createdUser);
    });

    it('ajoute un suffixe numérique si le pseudo dérivé est déjà pris', async () => {
      const takenPseudoUser = {
        id: 'other-user',
        pseudo: 'ana-etoile',
      } as User;
      prisma.user.findUnique
        .mockResolvedValueOnce(null) // pas de compte existant pour ce googleId
        .mockResolvedValueOnce(takenPseudoUser) // pseudo déjà pris
        .mockResolvedValueOnce(null); // "ana-etoile-2" est libre
      const createdUser = { id: 'user-3' } as User;
      prisma.user.create.mockResolvedValueOnce(createdUser);

      await service.findOrCreateFromGoogleProfile(googleProfile);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ pseudo: 'ana-etoile-2' }),
        }),
      );
    });
  });

  describe('createWithPassword', () => {
    it('crée un compte avec le hash fourni, jamais le mot de passe en clair', async () => {
      const created = { id: 'user-4' } as User;
      prisma.user.create.mockResolvedValueOnce(created);

      const result = await service.createWithPassword({
        email: 'ana@example.com',
        pseudo: 'ana-etoile',
        passwordHash: 'hashed-value',
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'ana@example.com',
          pseudo: 'ana-etoile',
          passwordHash: 'hashed-value',
        },
      });
      expect(result).toBe(created);
    });
  });

  describe('updateProfile', () => {
    it("met à jour uniquement les champs fournis pour l'utilisateur ciblé", async () => {
      const updated = { id: 'user-1', bio: 'Fan de metal.' } as User;
      prisma.user.update.mockResolvedValueOnce(updated);

      const result = await service.updateProfile('user-1', {
        bio: 'Fan de metal.',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { bio: 'Fan de metal.' },
      });
      expect(result).toBe(updated);
    });
  });

  describe('findAttendedConcerts', () => {
    it('renvoie les concerts assistés du plus récent au plus ancien', async () => {
      const concert = { id: 'concert-1', artistName: 'Muse' };
      prisma.concertAttendance.findMany.mockResolvedValueOnce([
        { id: 'attendance-1', concert },
      ]);

      const result = await service.findAttendedConcerts('user-1');

      expect(prisma.concertAttendance.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { concert: true },
        orderBy: { concert: { date: 'desc' } },
      });
      expect(result).toEqual([concert]);
    });
  });

  describe('toPublicUser', () => {
    it("n'expose ni googleId ni dates internes", () => {
      const user = {
        id: 'user-1',
        pseudo: 'ana-etoile',
        email: 'ana@example.com',
        avatarUrl: 'https://example.com/avatar.png',
        bio: 'Fan de rock depuis toujours.',
        googleId: 'google-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;

      expect(toPublicUser(user)).toEqual({
        id: 'user-1',
        pseudo: 'ana-etoile',
        email: 'ana@example.com',
        avatarUrl: 'https://example.com/avatar.png',
        bio: 'Fan de rock depuis toujours.',
      });
    });
  });
});
