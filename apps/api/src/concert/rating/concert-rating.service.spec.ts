import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { ConcertRatingService } from './concert-rating.service';

describe('ConcertRatingService', () => {
  let service: ConcertRatingService;
  let prisma: { concertRating: { upsert: jest.Mock; aggregate: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      concertRating: {
        upsert: jest.fn(),
        aggregate: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConcertRatingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ConcertRatingService);
  });

  describe('rate', () => {
    it("crée ou remplace la note de l'utilisateur pour ce concert (une seule note par personne)", async () => {
      await service.rate('concert-1', 'user-1', 4);

      expect(prisma.concertRating.upsert).toHaveBeenCalledWith({
        where: {
          userId_concertId: { userId: 'user-1', concertId: 'concert-1' },
        },
        create: { userId: 'user-1', concertId: 'concert-1', value: 4 },
        update: { value: 4 },
      });
    });
  });

  describe('getSummary', () => {
    it('renvoie la moyenne et le nombre de notes', async () => {
      prisma.concertRating.aggregate.mockResolvedValueOnce({
        _avg: { value: 4.5 },
        _count: 2,
      });

      const result = await service.getSummary('concert-1');

      expect(result).toEqual({ average: 4.5, count: 2 });
    });

    it("renvoie une moyenne nulle quand il n'y a aucune note", async () => {
      prisma.concertRating.aggregate.mockResolvedValueOnce({
        _avg: { value: null },
        _count: 0,
      });

      const result = await service.getSummary('concert-1');

      expect(result).toEqual({ average: null, count: 0 });
    });
  });
});
