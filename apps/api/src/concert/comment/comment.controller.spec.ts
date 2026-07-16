import { Test, TestingModule } from '@nestjs/testing';
import { ReportReason } from '@prisma/client';
import type { PublicUser } from '@reverb/shared';
import { ReportService } from '../report/report.service';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

describe('CommentController', () => {
  let controller: CommentController;
  let commentService: { delete: jest.Mock };
  let reportService: { reportComment: jest.Mock };

  const currentUser: PublicUser = {
    id: 'user-1',
    pseudo: 'ana-etoile',
    email: 'ana@example.com',
    avatarUrl: null,
    bio: null,
  };
  beforeEach(async () => {
    commentService = { delete: jest.fn() };
    reportService = { reportComment: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentController],
      providers: [
        { provide: CommentService, useValue: commentService },
        { provide: ReportService, useValue: reportService },
      ],
    }).compile();

    controller = module.get(CommentController);
  });

  describe('delete', () => {
    it("délègue la suppression au service avec l'id de l'utilisateur connecté", async () => {
      await controller.delete('comment-1', currentUser);

      expect(commentService.delete).toHaveBeenCalledWith('comment-1', 'user-1');
    });
  });

  describe('report', () => {
    it("délègue le signalement au service avec l'id de l'utilisateur connecté", async () => {
      await controller.report(
        'comment-1',
        { reason: ReportReason.SPAM },
        currentUser,
      );

      expect(reportService.reportComment).toHaveBeenCalledWith(
        'comment-1',
        'user-1',
        ReportReason.SPAM,
      );
    });
  });
});
