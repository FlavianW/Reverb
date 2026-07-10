import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import type { PublicUser } from '../../user/user.service';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

describe('CommentController', () => {
  let controller: CommentController;
  let commentService: { delete: jest.Mock };

  const currentUser: PublicUser = {
    id: 'user-1',
    pseudo: 'ana-etoile',
    email: 'ana@example.com',
    avatarUrl: null,
    bio: null,
  };
  const requestAsCurrentUser = { user: currentUser } as unknown as Request;

  beforeEach(async () => {
    commentService = { delete: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentController],
      providers: [{ provide: CommentService, useValue: commentService }],
    }).compile();

    controller = module.get(CommentController);
  });

  describe('delete', () => {
    it("délègue la suppression au service avec l'id de l'utilisateur connecté", async () => {
      await controller.delete('comment-1', requestAsCurrentUser);

      expect(commentService.delete).toHaveBeenCalledWith('comment-1', 'user-1');
    });
  });
});
