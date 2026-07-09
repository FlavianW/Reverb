import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { ConcertAttendanceService } from './concert-attendance.service';

describe('ConcertAttendanceService', () => {
  let service: ConcertAttendanceService;
  let prisma: {
    concertAttendance: {
      upsert: jest.Mock;
      deleteMany: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      concertAttendance: {
        upsert: jest.fn(),
        deleteMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConcertAttendanceService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ConcertAttendanceService);
  });

  describe('markAttended', () => {
    it("est idempotent : marquer deux fois n'échoue pas grâce à l'upsert sur la contrainte unique", async () => {
      await service.markAttended('concert-1', 'user-1');

      expect(prisma.concertAttendance.upsert).toHaveBeenCalledWith({
        where: {
          userId_concertId: { userId: 'user-1', concertId: 'concert-1' },
        },
        create: { userId: 'user-1', concertId: 'concert-1' },
        update: {},
      });
    });
  });

  describe('unmarkAttended', () => {
    it('supprime la marque sans échouer même si elle est absente', async () => {
      await service.unmarkAttended('concert-1', 'user-1');

      expect(prisma.concertAttendance.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', concertId: 'concert-1' },
      });
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
