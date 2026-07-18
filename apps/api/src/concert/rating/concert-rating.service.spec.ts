import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from '../../post/post.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConcertRatingService } from './concert-rating.service';

describe('ConcertRatingService', () => {
  let service: ConcertRatingService;
  let prisma: {
    $transaction: jest.Mock;
    concertRating: { aggregate: jest.Mock };
  };
  let tx: { concertRating: { findUnique: jest.Mock; upsert: jest.Mock } };
  let postService: { createRatingPost: jest.Mock };

  beforeEach(async () => {
    tx = {
      concertRating: { findUnique: jest.fn(), upsert: jest.fn() },
    };
    prisma = {
      $transaction: jest.fn((callback: (tx: unknown) => Promise<unknown>) =>
        callback(tx),
      ),
      concertRating: { aggregate: jest.fn() },
    };
    postService = { createRatingPost: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConcertRatingService,
        { provide: PrismaService, useValue: prisma },
        { provide: PostService, useValue: postService },
      ],
    }).compile();

    service = module.get(ConcertRatingService);
  });

  describe('rate', () => {
    it("crée ou remplace la note de l'utilisateur pour ce concert (une seule note par personne)", async () => {
      tx.concertRating.findUnique.mockResolvedValueOnce({ id: 'existing' });

      await service.rate('concert-1', 'user-1', 4);

      expect(tx.concertRating.upsert).toHaveBeenCalledWith({
        where: {
          userId_concertId: { userId: 'user-1', concertId: 'concert-1' },
        },
        create: { userId: 'user-1', concertId: 'concert-1', value: 4 },
        update: { value: 4 },
      });
    });

    it('génère un post dans le fil à la toute première notation', async () => {
      tx.concertRating.findUnique.mockResolvedValueOnce(null);

      await service.rate('concert-1', 'user-1', 4);

      expect(postService.createRatingPost).toHaveBeenCalledWith(
        tx,
        'concert-1',
        'user-1',
        4,
      );
    });

    it("ne génère pas de nouveau post lors d'une re-notation", async () => {
      tx.concertRating.findUnique.mockResolvedValueOnce({ id: 'existing' });

      await service.rate('concert-1', 'user-1', 2);

      expect(postService.createRatingPost).not.toHaveBeenCalled();
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
