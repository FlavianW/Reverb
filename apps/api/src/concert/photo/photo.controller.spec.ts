import { Test, TestingModule } from '@nestjs/testing';
import { ReportReason } from '@prisma/client';
import type { Request } from 'express';
import type { PublicUser } from '../../user/user.service';
import { ReportService } from '../report/report.service';
import { PhotoController } from './photo.controller';
import { PhotoService } from './photo.service';

describe('PhotoController', () => {
  let controller: PhotoController;
  let photoService: { delete: jest.Mock };
  let reportService: { reportPhoto: jest.Mock };

  const currentUser: PublicUser = {
    id: 'user-1',
    pseudo: 'ana-etoile',
    email: 'ana@example.com',
    avatarUrl: null,
    bio: null,
  };
  const requestAsCurrentUser = { user: currentUser } as unknown as Request;

  beforeEach(async () => {
    photoService = { delete: jest.fn() };
    reportService = { reportPhoto: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PhotoController],
      providers: [
        { provide: PhotoService, useValue: photoService },
        { provide: ReportService, useValue: reportService },
      ],
    }).compile();

    controller = module.get(PhotoController);
  });

  describe('delete', () => {
    it("délègue la suppression au service avec l'id de l'utilisateur connecté", async () => {
      await controller.delete('photo-1', requestAsCurrentUser);

      expect(photoService.delete).toHaveBeenCalledWith('photo-1', 'user-1');
    });
  });

  describe('report', () => {
    it("délègue le signalement au service avec l'id de l'utilisateur connecté", async () => {
      await controller.report(
        'photo-1',
        { reason: ReportReason.INAPPROPRIATE },
        requestAsCurrentUser,
      );

      expect(reportService.reportPhoto).toHaveBeenCalledWith(
        'photo-1',
        'user-1',
        ReportReason.INAPPROPRIATE,
      );
    });
  });
});
