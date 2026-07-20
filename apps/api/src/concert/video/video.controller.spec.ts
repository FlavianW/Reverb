import { Test, TestingModule } from '@nestjs/testing';
import { ReportReason } from '@prisma/client';
import type { PublicUser } from '@reverb/shared';
import { ReportService } from '../report/report.service';
import { VideoController } from './video.controller';
import { ConcertVideoService } from './video.service';

describe('VideoController', () => {
  let controller: VideoController;
  let videoService: { delete: jest.Mock };
  let reportService: { reportVideo: jest.Mock };

  const currentUser: PublicUser = {
    id: 'user-1',
    pseudo: 'ana-etoile',
    email: 'ana@example.com',
    avatarUrl: null,
    bannerUrl: null,
    bio: null,
    favoriteArtist: null,
  };
  beforeEach(async () => {
    videoService = { delete: jest.fn() };
    reportService = { reportVideo: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoController],
      providers: [
        { provide: ConcertVideoService, useValue: videoService },
        { provide: ReportService, useValue: reportService },
      ],
    }).compile();

    controller = module.get(VideoController);
  });

  describe('delete', () => {
    it("délègue la suppression au service avec l'id de l'utilisateur connecté", async () => {
      await controller.delete('video-1', currentUser);

      expect(videoService.delete).toHaveBeenCalledWith('video-1', 'user-1');
    });
  });

  describe('report', () => {
    it("délègue le signalement au service avec l'id de l'utilisateur connecté", async () => {
      await controller.report(
        'video-1',
        { reason: ReportReason.INAPPROPRIATE },
        currentUser,
      );

      expect(reportService.reportVideo).toHaveBeenCalledWith(
        'video-1',
        'user-1',
        ReportReason.INAPPROPRIATE,
      );
    });
  });
});
