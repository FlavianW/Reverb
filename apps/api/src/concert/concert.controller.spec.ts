import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConcertController } from './concert.controller';
import { ConcertService } from './concert.service';

describe('ConcertController', () => {
  let controller: ConcertController;
  let concertService: { findPageById: jest.Mock; create: jest.Mock };

  beforeEach(async () => {
    concertService = { findPageById: jest.fn(), create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConcertController],
      providers: [{ provide: ConcertService, useValue: concertService }],
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
      const page = {
        id: 'concert-1',
        artistName: 'Muse',
        setlist: null,
      };
      concertService.findPageById.mockResolvedValueOnce(page);

      const result = await controller.getById('concert-1');

      expect(result).toBe(page);
    });
  });
});
