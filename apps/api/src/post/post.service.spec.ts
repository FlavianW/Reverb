import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from '../media/s3.service';
import { PrismaService } from '../prisma/prisma.service';
import { PostService } from './post.service';

function fakePost(id: string) {
  return {
    id,
    type: 'PHOTO',
    authorId: 'user-1',
    concertId: null,
    content: 'hello',
    ratingValue: null,
    createdAt: new Date('2026-01-01'),
    author: { pseudo: 'user1', avatarUrl: null },
    concert: null,
    photos: [],
    video: null,
    likes: [],
    _count: { likes: 0 },
  };
}

describe('PostService', () => {
  let service: PostService;
  let prisma: {
    friendship: { findMany: jest.Mock };
    post: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
  };
  let s3Service: {
    uploadObject: jest.Mock;
    deleteObject: jest.Mock;
    headObject: jest.Mock;
    createPresignedUpload: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      friendship: { findMany: jest.fn() },
      post: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };
    s3Service = {
      uploadObject: jest.fn(),
      deleteObject: jest.fn(),
      headObject: jest.fn(),
      createPresignedUpload: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: PrismaService, useValue: prisma },
        { provide: S3Service, useValue: s3Service },
      ],
    }).compile();

    service = module.get(PostService);
  });

  describe('getFeed', () => {
    it('filtre le fil sur les amis acceptés (des deux côtés) et soi-même', async () => {
      prisma.friendship.findMany.mockResolvedValueOnce([
        { requesterId: 'user-1', addresseeId: 'friend-1' },
        { requesterId: 'friend-2', addresseeId: 'user-1' },
      ]);
      prisma.post.findMany.mockResolvedValueOnce([]);

      await service.getFeed('user-1');

      expect(prisma.friendship.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACCEPTED',
          OR: [{ requesterId: 'user-1' }, { addresseeId: 'user-1' }],
        },
      });
      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { authorId: { in: ['friend-1', 'friend-2', 'user-1'] } },
        }),
      );
    });

    it('renvoie un nextCursor quand il y a plus de résultats que la page demandée', async () => {
      prisma.friendship.findMany.mockResolvedValueOnce([]);
      prisma.post.findMany.mockResolvedValueOnce([
        fakePost('p1'),
        fakePost('p2'),
        fakePost('p3'),
      ]);

      const page = await service.getFeed('user-1', undefined, 2);

      expect(page.items).toHaveLength(2);
      expect(page.nextCursor).toBe('p2');
    });

    it("renvoie nextCursor=null quand il n'y a pas de page suivante", async () => {
      prisma.friendship.findMany.mockResolvedValueOnce([]);
      prisma.post.findMany.mockResolvedValueOnce([
        fakePost('p1'),
        fakePost('p2'),
      ]);

      const page = await service.getFeed('user-1', undefined, 2);

      expect(page.items).toHaveLength(2);
      expect(page.nextCursor).toBeNull();
    });
  });

  describe('delete', () => {
    it("lève une 404 si le post n'existe pas", async () => {
      prisma.post.findUnique.mockResolvedValueOnce(null);

      await expect(service.delete('post-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it("refuse la suppression d'un post RATING même par son auteur", async () => {
      prisma.post.findUnique.mockResolvedValueOnce({
        id: 'post-1',
        type: 'RATING',
        authorId: 'user-1',
        photos: [],
      });

      await expect(service.delete('post-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.post.delete).not.toHaveBeenCalled();
    });

    it("refuse la suppression d'un post PHOTO par un non-auteur", async () => {
      prisma.post.findUnique.mockResolvedValueOnce({
        id: 'post-1',
        type: 'PHOTO',
        authorId: 'other-user',
        photos: [],
      });

      await expect(service.delete('post-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('supprime un post PHOTO de son auteur et ses photos S3', async () => {
      prisma.post.findUnique.mockResolvedValueOnce({
        id: 'post-1',
        type: 'PHOTO',
        authorId: 'user-1',
        photos: [{ key: 'posts/post-1/a.jpg' }],
      });

      await service.delete('post-1', 'user-1');

      expect(s3Service.deleteObject).toHaveBeenCalledWith('posts/post-1/a.jpg');
      expect(prisma.post.delete).toHaveBeenCalledWith({
        where: { id: 'post-1' },
      });
    });
  });

  describe('createPhotoPost', () => {
    it('refuse un post sans contenu ni photo', async () => {
      await expect(
        service.createPhotoPost('user-1', { files: [] }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.post.create).not.toHaveBeenCalled();
    });
  });

  describe('presignVideoUpload', () => {
    it('refuse un type MIME non supporté', async () => {
      await expect(service.presignVideoUpload('video/webm')).rejects.toThrow(
        BadRequestException,
      );
      expect(s3Service.createPresignedUpload).not.toHaveBeenCalled();
    });

    it("génère une clé sous posts/{postId}/original et renvoie l'id du futur post", async () => {
      s3Service.createPresignedUpload.mockResolvedValueOnce({
        url: 'http://localhost:9000/reverb-media',
        fields: {},
      });

      const result = await service.presignVideoUpload('video/mp4');

      expect(result.key).toBe(`posts/${result.postId}/original.mp4`);
      expect(s3Service.createPresignedUpload).toHaveBeenCalledWith(
        result.key,
        'video/mp4',
        expect.any(Number),
      );
    });
  });

  describe('createVideoPost', () => {
    it('refuse une clé qui ne correspond pas au postId annoncé', async () => {
      await expect(
        service.createVideoPost('user-1', {
          postId: 'post-1',
          key: 'posts/autre-post/original.mp4',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(s3Service.headObject).not.toHaveBeenCalled();
    });

    it("refuse si la vidéo n'a pas été trouvée dans le stockage", async () => {
      s3Service.headObject.mockResolvedValueOnce(false);

      await expect(
        service.createVideoPost('user-1', {
          postId: 'post-1',
          key: 'posts/post-1/original.mp4',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.post.create).not.toHaveBeenCalled();
    });

    it('crée le post avec la vidéo rattachée quand tout est valide', async () => {
      s3Service.headObject.mockResolvedValueOnce(true);
      prisma.post.create.mockResolvedValueOnce({
        ...fakePost('post-1'),
        video: {
          id: 'video-1',
          status: 'PROCESSING',
          playbackUrl: null,
          posterUrl: null,
          durationSeconds: null,
        },
      });

      const result = await service.createVideoPost('user-1', {
        postId: 'post-1',
        key: 'posts/post-1/original.mp4',
        content: 'hello',
      });

      expect(prisma.post.create).toHaveBeenCalledWith({
        data: {
          id: 'post-1',
          type: 'PHOTO',
          authorId: 'user-1',
          concertId: undefined,
          content: 'hello',
          video: {
            create: {
              key: 'posts/post-1/original.mp4',
              uploadedById: 'user-1',
            },
          },
        },
        include: expect.anything(),
      });
      expect(result.video).toEqual({
        id: 'video-1',
        status: 'PROCESSING',
        url: null,
        posterUrl: null,
        durationSeconds: null,
      });
    });
  });
});
