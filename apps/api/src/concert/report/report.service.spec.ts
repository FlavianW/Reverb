import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ReportReason } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportService } from './report.service';

describe('ReportService', () => {
  let service: ReportService;
  let prisma: {
    comment: { findUnique: jest.Mock };
    photo: { findUnique: jest.Mock };
    report: { findFirst: jest.Mock; create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      comment: { findUnique: jest.fn() },
      photo: { findUnique: jest.fn() },
      report: { findFirst: jest.fn(), create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ReportService);
  });

  describe('reportComment', () => {
    it("lève une 404 si le commentaire n'existe pas", async () => {
      prisma.comment.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.reportComment('comment-1', 'user-1', ReportReason.SPAM),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.report.create).not.toHaveBeenCalled();
    });

    it('refuse un second signalement du même commentaire par le même utilisateur', async () => {
      prisma.comment.findUnique.mockResolvedValueOnce({ id: 'comment-1' });
      prisma.report.findFirst.mockResolvedValueOnce({ id: 'report-1' });

      await expect(
        service.reportComment('comment-1', 'user-1', ReportReason.SPAM),
      ).rejects.toThrow(ConflictException);
      expect(prisma.report.create).not.toHaveBeenCalled();
    });

    it('enregistre le signalement du commentaire', async () => {
      prisma.comment.findUnique.mockResolvedValueOnce({ id: 'comment-1' });
      prisma.report.findFirst.mockResolvedValueOnce(null);

      await service.reportComment('comment-1', 'user-1', ReportReason.SPAM);

      expect(prisma.report.create).toHaveBeenCalledWith({
        data: {
          commentId: 'comment-1',
          reporterId: 'user-1',
          reason: ReportReason.SPAM,
        },
      });
    });
  });

  describe('reportPhoto', () => {
    it("lève une 404 si la photo n'existe pas", async () => {
      prisma.photo.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.reportPhoto('photo-1', 'user-1', ReportReason.INAPPROPRIATE),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.report.create).not.toHaveBeenCalled();
    });

    it('refuse un second signalement de la même photo par le même utilisateur', async () => {
      prisma.photo.findUnique.mockResolvedValueOnce({ id: 'photo-1' });
      prisma.report.findFirst.mockResolvedValueOnce({ id: 'report-1' });

      await expect(
        service.reportPhoto('photo-1', 'user-1', ReportReason.INAPPROPRIATE),
      ).rejects.toThrow(ConflictException);
      expect(prisma.report.create).not.toHaveBeenCalled();
    });

    it('enregistre le signalement de la photo', async () => {
      prisma.photo.findUnique.mockResolvedValueOnce({ id: 'photo-1' });
      prisma.report.findFirst.mockResolvedValueOnce(null);

      await service.reportPhoto(
        'photo-1',
        'user-1',
        ReportReason.INAPPROPRIATE,
      );

      expect(prisma.report.create).toHaveBeenCalledWith({
        data: {
          photoId: 'photo-1',
          reporterId: 'user-1',
          reason: ReportReason.INAPPROPRIATE,
        },
      });
    });
  });
});
