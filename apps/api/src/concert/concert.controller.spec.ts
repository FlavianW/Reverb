import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import type { PublicUser } from '../user/user.service';
import { ConcertAttendanceService } from './attendance/concert-attendance.service';
import { ConcertController } from './concert.controller';
import { ConcertService } from './concert.service';

describe('ConcertController', () => {
  let controller: ConcertController;
  let concertService: {
    findPageById: jest.Mock;
    create: jest.Mock;
    exists: jest.Mock;
  };
  let attendanceService: {
    markAttended: jest.Mock;
    unmarkAttended: jest.Mock;
    isAttendedBy: jest.Mock;
  };

  const currentUser: PublicUser = {
    id: 'user-1',
    pseudo: 'ana-etoile',
    email: 'ana@example.com',
    avatarUrl: null,
  };
  const requestAsCurrentUser = { user: currentUser } as unknown as Request;

  beforeEach(async () => {
    concertService = {
      findPageById: jest.fn(),
      create: jest.fn(),
      exists: jest.fn(),
    };
    attendanceService = {
      markAttended: jest.fn(),
      unmarkAttended: jest.fn(),
      isAttendedBy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConcertController],
      providers: [
        { provide: ConcertService, useValue: concertService },
        { provide: ConcertAttendanceService, useValue: attendanceService },
      ],
    }).compile();

    controller = module.get(ConcertController);
  });

  describe('getById', () => {
    it("lève une 404 explicite si le concert n'existe pas", async () => {
      concertService.findPageById.mockResolvedValueOnce(null);

      await expect(
        controller.getById('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(NotFoundException);
    });

    it('renvoie la page concert quand elle existe', async () => {
      const page = { id: 'concert-1', artistName: 'Muse', setlist: null };
      concertService.findPageById.mockResolvedValueOnce(page);

      const result = await controller.getById('concert-1');

      expect(result).toBe(page);
    });
  });

  describe('markAttendance / unmarkAttendance / getAttendance', () => {
    it("lève une 404 si le concert n'existe pas", async () => {
      concertService.exists.mockResolvedValueOnce(false);

      await expect(
        controller.markAttendance('concert-1', requestAsCurrentUser),
      ).rejects.toThrow(NotFoundException);
      expect(attendanceService.markAttended).not.toHaveBeenCalled();
    });

    it("marque le concert comme vu pour l'utilisateur connecté", async () => {
      concertService.exists.mockResolvedValueOnce(true);

      await controller.markAttendance('concert-1', requestAsCurrentUser);

      expect(attendanceService.markAttended).toHaveBeenCalledWith(
        'concert-1',
        'user-1',
      );
    });

    it('retire la marque pour l’utilisateur connecté', async () => {
      concertService.exists.mockResolvedValueOnce(true);

      await controller.unmarkAttendance('concert-1', requestAsCurrentUser);

      expect(attendanceService.unmarkAttended).toHaveBeenCalledWith(
        'concert-1',
        'user-1',
      );
    });

    it('renvoie le statut courant', async () => {
      concertService.exists.mockResolvedValueOnce(true);
      attendanceService.isAttendedBy.mockResolvedValueOnce(true);

      const result = await controller.getAttendance(
        'concert-1',
        requestAsCurrentUser,
      );

      expect(result).toEqual({ attending: true });
    });
  });
});
