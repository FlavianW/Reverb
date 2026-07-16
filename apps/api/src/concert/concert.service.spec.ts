import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CommentService } from './comment/comment.service';
import { ConcertService } from './concert.service';
import { PhotoService } from './photo/photo.service';
import { ConcertRatingService } from './rating/concert-rating.service';
import { SetlistFmService } from './setlistfm.service';

describe('ConcertService', () => {
  let service: ConcertService;
  let prisma: {
    concert: { create: jest.Mock; findUnique: jest.Mock; findMany: jest.Mock };
  };
  let setlistFmService: { findSetlist: jest.Mock };
  let ratingService: { getSummary: jest.Mock };
  let commentService: { findByConcert: jest.Mock };
  let photoService: { findByConcert: jest.Mock };

  const baseConcert = {
    id: 'concert-1',
    artistName: 'Muse',
    venueName: 'AccorHotels Arena',
    city: 'Paris',
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const emptyRating = { average: null, count: 0 };
  const noComments: never[] = [];
  const noPhotos: never[] = [];

  beforeEach(async () => {
    prisma = {
      concert: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };
    setlistFmService = { findSetlist: jest.fn() };
    ratingService = { getSummary: jest.fn().mockResolvedValue(emptyRating) };
    commentService = { findByConcert: jest.fn().mockResolvedValue(noComments) };
    photoService = { findByConcert: jest.fn().mockResolvedValue(noPhotos) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConcertService,
        { provide: PrismaService, useValue: prisma },
        { provide: SetlistFmService, useValue: setlistFmService },
        { provide: ConcertRatingService, useValue: ratingService },
        { provide: CommentService, useValue: commentService },
        { provide: PhotoService, useValue: photoService },
      ],
    }).compile();

    service = module.get(ConcertService);
  });

  describe('create', () => {
    it("associe le concert créé à l'utilisateur connecté", async () => {
      const created = {
        ...baseConcert,
        date: new Date('2024-06-15'),
      };
      prisma.concert.create.mockResolvedValueOnce(created);

      const result = await service.create(
        {
          artistName: 'Muse',
          venueName: 'AccorHotels Arena',
          city: 'Paris',
          date: new Date('2024-06-15'),
        },
        'user-1',
      );

      expect(prisma.concert.create).toHaveBeenCalledWith({
        data: {
          artistName: 'Muse',
          venueName: 'AccorHotels Arena',
          city: 'Paris',
          date: new Date('2024-06-15'),
          createdById: 'user-1',
        },
      });
      expect(result).toBe(created);
    });
  });

  describe('findPageById', () => {
    it('renvoie null si le concert n’existe pas', async () => {
      prisma.concert.findUnique.mockResolvedValueOnce(null);

      const result = await service.findPageById('missing');

      expect(result).toBeNull();
      expect(setlistFmService.findSetlist).not.toHaveBeenCalled();
    });

    it("n'interroge pas Setlist.fm pour un concert à venir", async () => {
      const futureConcert = {
        ...baseConcert,
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      };
      prisma.concert.findUnique.mockResolvedValueOnce(futureConcert);

      const result = await service.findPageById('concert-1');

      expect(setlistFmService.findSetlist).not.toHaveBeenCalled();
      expect(result).toEqual({
        ...futureConcert,
        setlist: null,
        rating: emptyRating,
        comments: noComments,
        photos: noPhotos,
      });
    });

    it('enrichit un concert passé avec la setlist trouvée', async () => {
      const pastConcert = {
        ...baseConcert,
        date: new Date('2020-01-01'),
      };
      prisma.concert.findUnique.mockResolvedValueOnce(pastConcert);
      setlistFmService.findSetlist.mockResolvedValueOnce({ songs: ['Song A'] });

      const result = await service.findPageById('concert-1');

      expect(setlistFmService.findSetlist).toHaveBeenCalledWith({
        artistName: 'Muse',
        city: 'Paris',
        date: pastConcert.date,
      });
      expect(result).toEqual({
        ...pastConcert,
        setlist: { songs: ['Song A'] },
        rating: emptyRating,
        comments: noComments,
        photos: noPhotos,
      });
    });

    it('renvoie setlist: null pour un concert passé absent de Setlist.fm', async () => {
      const pastConcert = {
        ...baseConcert,
        date: new Date('2020-01-01'),
      };
      prisma.concert.findUnique.mockResolvedValueOnce(pastConcert);
      setlistFmService.findSetlist.mockResolvedValueOnce(null);

      const result = await service.findPageById('concert-1');

      expect(result).toEqual({
        ...pastConcert,
        setlist: null,
        rating: emptyRating,
        comments: noComments,
        photos: noPhotos,
      });
    });

    it('inclut la moyenne des notes dans la page concert', async () => {
      const pastConcert = {
        ...baseConcert,
        date: new Date('2020-01-01'),
      };
      prisma.concert.findUnique.mockResolvedValueOnce(pastConcert);
      setlistFmService.findSetlist.mockResolvedValueOnce(null);
      ratingService.getSummary.mockResolvedValueOnce({
        average: 4.5,
        count: 2,
      });

      const result = await service.findPageById('concert-1');

      expect(ratingService.getSummary).toHaveBeenCalledWith('concert-1');
      expect(result?.rating).toEqual({ average: 4.5, count: 2 });
    });

    it('inclut les commentaires du concert dans la page', async () => {
      const pastConcert = {
        ...baseConcert,
        date: new Date('2020-01-01'),
      };
      prisma.concert.findUnique.mockResolvedValueOnce(pastConcert);
      setlistFmService.findSetlist.mockResolvedValueOnce(null);
      const comments = [
        {
          id: 'comment-1',
          content: 'Super concert !',
          pseudo: 'ana-etoile',
          createdAt: new Date(),
        },
      ];
      commentService.findByConcert.mockResolvedValueOnce(comments);

      const result = await service.findPageById('concert-1');

      expect(commentService.findByConcert).toHaveBeenCalledWith('concert-1');
      expect(result?.comments).toBe(comments);
    });

    it('inclut les photos du concert dans la page', async () => {
      const pastConcert = {
        ...baseConcert,
        date: new Date('2020-01-01'),
      };
      prisma.concert.findUnique.mockResolvedValueOnce(pastConcert);
      setlistFmService.findSetlist.mockResolvedValueOnce(null);
      const photos = [
        {
          id: 'photo-1',
          url: 'https://example.com/reverb-media/concerts/concert-1/a.jpg',
          pseudo: 'ana-etoile',
          createdAt: new Date(),
        },
      ];
      photoService.findByConcert.mockResolvedValueOnce(photos);

      const result = await service.findPageById('concert-1');

      expect(photoService.findByConcert).toHaveBeenCalledWith('concert-1');
      expect(result?.photos).toBe(photos);
    });
  });

  describe('search', () => {
    it("recherche par nom d'artiste ou de salle, insensible à la casse", async () => {
      const matches = [baseConcert];
      prisma.concert.findMany.mockResolvedValueOnce(matches);

      const result = await service.search('muse');

      expect(prisma.concert.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { artistName: { contains: 'muse', mode: 'insensitive' } },
            { venueName: { contains: 'muse', mode: 'insensitive' } },
          ],
        },
        orderBy: { date: 'desc' },
        take: 20,
      });
      expect(result).toBe(matches);
    });

    it("renvoie une liste vide s'il n'y a aucune correspondance", async () => {
      prisma.concert.findMany.mockResolvedValueOnce([]);

      const result = await service.search('inconnu');

      expect(result).toEqual([]);
    });

    it("sans requête, renvoie les concerts les plus récents (fil d'accueil)", async () => {
      const recents = [baseConcert];
      prisma.concert.findMany.mockResolvedValueOnce(recents);

      const result = await service.search(undefined);

      expect(prisma.concert.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { date: 'desc' },
        take: 20,
      });
      expect(result).toBe(recents);
    });

    it('avec une requête vide ou uniquement des espaces, se comporte comme sans requête', async () => {
      prisma.concert.findMany.mockResolvedValueOnce([]);

      await service.search('   ');

      expect(prisma.concert.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { date: 'desc' },
        take: 20,
      });
    });
  });
});
