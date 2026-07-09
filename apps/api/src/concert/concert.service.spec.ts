import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ConcertService } from './concert.service';
import { ConcertRatingService } from './rating/concert-rating.service';
import { SetlistFmService } from './setlistfm.service';

describe('ConcertService', () => {
  let service: ConcertService;
  let prisma: { concert: { create: jest.Mock; findUnique: jest.Mock } };
  let setlistFmService: { findSetlist: jest.Mock };
  let ratingService: { getSummary: jest.Mock };

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

  beforeEach(async () => {
    prisma = {
      concert: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    setlistFmService = { findSetlist: jest.fn() };
    ratingService = { getSummary: jest.fn().mockResolvedValue(emptyRating) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConcertService,
        { provide: PrismaService, useValue: prisma },
        { provide: SetlistFmService, useValue: setlistFmService },
        { provide: ConcertRatingService, useValue: ratingService },
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
  });
});
