import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, User } from '@prisma/client';
import { LastFmService } from '../artist/lastfm.service';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleProfile, UserService, toPublicUser } from './user.service';

const uniqueConstraintViolation = () =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: '6.19.3',
  });

describe('UserService', () => {
  let service: UserService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    concertAttendance: { findMany: jest.Mock };
  };
  let lastFmService: { getArtistImage: jest.Mock; withArtistImages: jest.Mock };

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
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
      },
      concertAttendance: {
        findMany: jest.fn(),
      },
    };
    lastFmService = {
      getArtistImage: jest.fn().mockResolvedValue(null),
      // Mime `LastFmService.withArtistImages` en passant par le même mock
      // `getArtistImage`, pour que les tests restent focalisés sur ce dernier.
      withArtistImages: jest.fn(async (items: { artistName: string }[]) => {
        const distinctArtists = [...new Set(items.map((i) => i.artistName))];
        const images = await Promise.all(
          distinctArtists.map(
            (name) =>
              lastFmService.getArtistImage(name) as Promise<string | null>,
          ),
        );
        const imageByArtist = new Map(
          distinctArtists.map((name, index) => [name, images[index]]),
        );
        return items.map((item) => ({
          ...item,
          artistImageUrl: imageByArtist.get(item.artistName) ?? null,
        }));
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prisma },
        { provide: LastFmService, useValue: lastFmService },
      ],
    }).compile();

    service = module.get(UserService);
  });

  describe('findByPseudo', () => {
    it('privilégie la correspondance exacte sans requête supplémentaire', async () => {
      const exactUser = { id: 'user-1', pseudo: 'ana' } as User;
      prisma.user.findUnique.mockResolvedValueOnce(exactUser);

      await expect(service.findByPseudo('ana')).resolves.toBe(exactUser);
      expect(prisma.user.findFirst).not.toHaveBeenCalled();
    });

    it('retombe sur une recherche insensible à la casse (« Ana » trouve « ana »)', async () => {
      const user = { id: 'user-1', pseudo: 'ana' } as User;
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.user.findFirst.mockResolvedValueOnce(user);

      await expect(service.findByPseudo('Ana')).resolves.toBe(user);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { pseudo: { equals: 'Ana', mode: 'insensitive' } },
      });
    });

    it('renvoie null quand aucun pseudo ne correspond, même sans la casse', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.findByPseudo('inconnu')).resolves.toBeNull();
    });
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

    it('convertit une violation de contrainte unique en ConflictException (fenêtre de course avec le contrôleur)', async () => {
      prisma.user.create.mockRejectedValueOnce(uniqueConstraintViolation());

      await expect(
        service.createWithPassword({
          email: 'ana@example.com',
          pseudo: 'ana-etoile',
          passwordHash: 'hashed-value',
        }),
      ).rejects.toThrow(ConflictException);
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

    it('convertit une violation de contrainte unique en ConflictException', async () => {
      prisma.user.update.mockRejectedValueOnce(uniqueConstraintViolation());

      await expect(
        service.updateProfile('user-1', { pseudo: 'pseudo-pris' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getPublicProfile', () => {
    const user = {
      id: 'user-1',
      pseudo: 'ana-etoile',
      bio: 'Fan de rock.',
      avatarUrl: null,
      bannerUrl: null,
      favoriteArtist: 'Muse',
    } as User;

    it("renvoie null si l'utilisateur n'existe pas", async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      const result = await service.getPublicProfile('inconnu');

      expect(result).toBeNull();
      expect(lastFmService.getArtistImage).not.toHaveBeenCalled();
    });

    it("n'appelle pas Last.fm si aucun artiste favori n'est renseigné", async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        ...user,
        favoriteArtist: null,
      });
      prisma.concertAttendance.findMany.mockResolvedValueOnce([]);

      const result = await service.getPublicProfile('ana-etoile');

      expect(lastFmService.getArtistImage).not.toHaveBeenCalled();
      expect(result?.favoriteArtistImageUrl).toBeNull();
    });

    it("inclut la photo de l'artiste favori renvoyée par Last.fm", async () => {
      prisma.user.findUnique.mockResolvedValueOnce(user);
      prisma.concertAttendance.findMany.mockResolvedValueOnce([]);
      lastFmService.getArtistImage.mockResolvedValueOnce(
        'https://example.com/muse.jpg',
      );

      const result = await service.getPublicProfile('ana-etoile');

      expect(lastFmService.getArtistImage).toHaveBeenCalledWith('Muse');
      expect(result).toEqual({
        pseudo: 'ana-etoile',
        bio: 'Fan de rock.',
        avatarUrl: null,
        bannerUrl: null,
        favoriteArtist: 'Muse',
        favoriteArtistImageUrl: 'https://example.com/muse.jpg',
        attendedConcerts: [],
      });
    });
  });

  describe('findAttendedConcerts', () => {
    it('renvoie les concerts assistés avec la photo de leur artiste, du plus récent au plus ancien', async () => {
      const concert = { id: 'concert-1', artistName: 'Muse' };
      prisma.concertAttendance.findMany.mockResolvedValueOnce([
        { id: 'attendance-1', concert },
      ]);
      lastFmService.getArtistImage.mockResolvedValueOnce(
        'https://example.com/muse.jpg',
      );

      const result = await service.findAttendedConcerts('user-1');

      expect(prisma.concertAttendance.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { concert: true },
        orderBy: { concert: { date: 'desc' } },
      });
      expect(lastFmService.getArtistImage).toHaveBeenCalledWith('Muse');
      expect(result).toEqual([
        { ...concert, artistImageUrl: 'https://example.com/muse.jpg' },
      ]);
    });
  });

  describe('toPublicUser', () => {
    it("n'expose ni googleId ni dates internes", () => {
      const user = {
        id: 'user-1',
        pseudo: 'ana-etoile',
        email: 'ana@example.com',
        avatarUrl: 'https://example.com/avatar.png',
        bannerUrl: 'https://example.com/banner.png',
        bio: 'Fan de rock depuis toujours.',
        favoriteArtist: 'Muse',
        googleId: 'google-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;

      expect(toPublicUser(user)).toEqual({
        id: 'user-1',
        pseudo: 'ana-etoile',
        email: 'ana@example.com',
        avatarUrl: 'https://example.com/avatar.png',
        bannerUrl: 'https://example.com/banner.png',
        bio: 'Fan de rock depuis toujours.',
        favoriteArtist: 'Muse',
      });
    });
  });
});
