import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from '../../post/post.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConcertAttendanceService } from './concert-attendance.service';

describe('ConcertAttendanceService', () => {
  let service: ConcertAttendanceService;
  let prisma: {
    $transaction: jest.Mock;
    concertAttendance: {
      deleteMany: jest.Mock;
      findUnique: jest.Mock;
    };
  };
  let tx: { concertAttendance: { findUnique: jest.Mock; upsert: jest.Mock } };
  let postService: {
    createAttendancePost: jest.Mock;
    deleteAttendancePost: jest.Mock;
  };

  beforeEach(async () => {
    tx = {
      concertAttendance: { findUnique: jest.fn(), upsert: jest.fn() },
    };
    prisma = {
      $transaction: jest.fn((callback: (tx: unknown) => Promise<unknown>) =>
        callback(tx),
      ),
      concertAttendance: {
        deleteMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    postService = {
      createAttendancePost: jest.fn(),
      deleteAttendancePost: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConcertAttendanceService,
        { provide: PrismaService, useValue: prisma },
        { provide: PostService, useValue: postService },
      ],
    }).compile();

    service = module.get(ConcertAttendanceService);
  });

  describe('markAttended', () => {
    it("est idempotent : marquer deux fois n'échoue pas grâce à l'upsert sur la contrainte unique", async () => {
      tx.concertAttendance.findUnique.mockResolvedValueOnce({ id: 'existing' });

      await service.markAttended('concert-1', 'user-1');

      expect(tx.concertAttendance.upsert).toHaveBeenCalledWith({
        where: {
          userId_concertId: { userId: 'user-1', concertId: 'concert-1' },
        },
        create: { userId: 'user-1', concertId: 'concert-1' },
        update: {},
      });
    });

    it('génère un post dans le fil à la toute première déclaration de présence', async () => {
      tx.concertAttendance.findUnique.mockResolvedValueOnce(null);

      await service.markAttended('concert-1', 'user-1');

      expect(postService.createAttendancePost).toHaveBeenCalledWith(
        tx,
        'concert-1',
        'user-1',
      );
    });

    it('ne génère pas de nouveau post si déjà marqué présent', async () => {
      tx.concertAttendance.findUnique.mockResolvedValueOnce({ id: 'existing' });

      await service.markAttended('concert-1', 'user-1');

      expect(postService.createAttendancePost).not.toHaveBeenCalled();
    });
  });

  describe('unmarkAttended', () => {
    it('supprime la marque et le post associé sans échouer même si absents', async () => {
      await service.unmarkAttended('concert-1', 'user-1');

      expect(prisma.concertAttendance.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', concertId: 'concert-1' },
      });
      expect(postService.deleteAttendancePost).toHaveBeenCalledWith(
        'concert-1',
        'user-1',
      );
    });
  });

  describe('isAttendedBy', () => {
    it("renvoie true si l'utilisateur a marqué le concert", async () => {
      prisma.concertAttendance.findUnique.mockResolvedValueOnce({
        id: 'attendance-1',
      });

      expect(await service.isAttendedBy('concert-1', 'user-1')).toBe(true);
    });

    it('renvoie false sinon', async () => {
      prisma.concertAttendance.findUnique.mockResolvedValueOnce(null);

      expect(await service.isAttendedBy('concert-1', 'user-1')).toBe(false);
    });
  });
});
