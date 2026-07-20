import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Post, PostPhoto, Prisma, Video } from '@prisma/client';
import type {
  PostPage,
  PostSummary,
  PresignPostVideoUploadResponse,
} from '@reverb/shared';
import {
  MAX_VIDEO_SIZE_BYTES,
  VIDEO_EXTENSION_BY_MIME_TYPE,
  isAllowedVideoMimeType,
} from '../media/video-upload.config';
import { S3Service } from '../media/s3.service';
import { PrismaService } from '../prisma/prisma.service';

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const POST_INCLUDE = (viewerId: string) =>
  ({
    author: { select: { pseudo: true, avatarUrl: true } },
    concert: {
      select: { id: true, artistName: true, venueName: true, city: true },
    },
    photos: true,
    video: true,
    likes: { where: { userId: viewerId }, select: { id: true } },
    _count: { select: { likes: true } },
  }) satisfies Prisma.PostInclude;

type PostWithRelations = Post & {
  author: { pseudo: string; avatarUrl: string | null };
  concert: {
    id: string;
    artistName: string;
    venueName: string;
    city: string;
  } | null;
  photos: PostPhoto[];
  video: Video | null;
  likes: { id: string }[];
  _count: { likes: number };
};

/**
 * Gère le fil d'actualité (US-8.x) : posts générés automatiquement à la
 * notation/attendance d'un concert, ou créés explicitement (photos + texte).
 */
@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  /** Appelée depuis `ConcertRatingService.rate`, dans la même transaction. */
  async createRatingPost(
    tx: Prisma.TransactionClient,
    concertId: string,
    authorId: string,
    ratingValue: number,
  ): Promise<void> {
    await tx.post.create({
      data: { type: 'RATING', authorId, concertId, ratingValue },
    });
  }

  /** Appelée depuis `ConcertAttendanceService.markAttended`, dans la même transaction. */
  async createAttendancePost(
    tx: Prisma.TransactionClient,
    concertId: string,
    authorId: string,
  ): Promise<void> {
    await tx.post.create({ data: { type: 'ATTENDANCE', authorId, concertId } });
  }

  /**
   * Appelée depuis `ConcertAttendanceService.unmarkAttended` : le post reflète
   * l'attendance, il n'a pas de vie propre une fois celle-ci retirée.
   */
  async deleteAttendancePost(
    concertId: string,
    authorId: string,
  ): Promise<void> {
    await this.prisma.post.deleteMany({
      where: { type: 'ATTENDANCE', concertId, authorId },
    });
  }

  async createPhotoPost(
    authorId: string,
    input: {
      content?: string;
      concertId?: string;
      files: Express.Multer.File[];
    },
  ): Promise<PostSummary> {
    if (!input.content && input.files.length === 0) {
      throw new BadRequestException(
        'Un post doit contenir au moins une photo ou un texte.',
      );
    }

    const postId = randomUUID();
    const uploaded: { key: string; url: string }[] = [];
    try {
      for (const file of input.files) {
        const extension = EXTENSION_BY_MIME_TYPE[file.mimetype] ?? 'jpg';
        const key = `posts/${postId}/${randomUUID()}.${extension}`;
        const url = await this.s3Service.uploadObject(
          key,
          file.buffer,
          file.mimetype,
        );
        uploaded.push({ key, url });
      }
    } catch (error) {
      this.logger.error(
        `Échec de l'upload S3 pour le post ${postId}`,
        error instanceof Error ? error.stack : error,
      );
      throw new ServiceUnavailableException(
        'Le service de stockage est momentanément indisponible.',
      );
    }

    const post = await this.prisma.post.create({
      data: {
        id: postId,
        type: 'PHOTO',
        authorId,
        concertId: input.concertId,
        content: input.content,
        photos: { create: uploaded },
      },
      include: POST_INCLUDE(authorId),
    });

    return this.toSummary(post);
  }

  /**
   * Génère une URL d'upload vidéo direct vers S3 pour un futur post. L'id du
   * post est décidé ici (avant qu'il existe) afin que la clé S3 puisse le
   * référencer ; le client renvoie ce même id à `createVideoPost`.
   */
  async presignVideoUpload(
    contentType: string,
  ): Promise<PresignPostVideoUploadResponse> {
    if (!isAllowedVideoMimeType(contentType)) {
      throw new BadRequestException(
        'Format vidéo non supporté (MP4 ou MOV attendu).',
      );
    }
    const postId = randomUUID();
    const extension = VIDEO_EXTENSION_BY_MIME_TYPE[contentType];
    const key = `posts/${postId}/original.${extension}`;
    const { url, fields } = await this.s3Service.createPresignedUpload(
      key,
      contentType,
      MAX_VIDEO_SIZE_BYTES,
    );
    return { uploadUrl: url, fields, key, postId };
  }

  /** Crée un post explicite dont le média est une vidéo déjà uploadée (mutuellement exclusif des photos). */
  async createVideoPost(
    authorId: string,
    input: {
      postId: string;
      key: string;
      content?: string;
      concertId?: string;
    },
  ): Promise<PostSummary> {
    if (!input.key.startsWith(`posts/${input.postId}/original.`)) {
      throw new BadRequestException('Clé vidéo invalide pour ce post.');
    }
    if (!(await this.s3Service.headObject(input.key))) {
      throw new BadRequestException(
        "La vidéo n'a pas été trouvée dans le stockage — vérifiez que l'upload est terminé.",
      );
    }

    const post = await this.prisma.post.create({
      data: {
        id: input.postId,
        type: 'PHOTO',
        authorId,
        concertId: input.concertId,
        content: input.content,
        video: { create: { key: input.key, uploadedById: authorId } },
      },
      include: POST_INCLUDE(authorId),
    });

    return this.toSummary(post);
  }

  async delete(postId: string, userId: string): Promise<void> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { photos: true, video: true },
    });
    if (!post) {
      throw new NotFoundException('Post introuvable.');
    }
    if (post.type !== 'PHOTO' || post.authorId !== userId) {
      throw new ForbiddenException("Seul l'auteur peut supprimer ce post.");
    }

    for (const photo of post.photos) {
      await this.s3Service.deleteObject(photo.key);
    }
    if (post.video) {
      await this.s3Service.deleteObject(post.video.key);
      if (post.video.playbackKey) {
        await this.s3Service.deleteObject(post.video.playbackKey);
      }
      if (post.video.posterKey) {
        await this.s3Service.deleteObject(post.video.posterKey);
      }
    }
    await this.prisma.post.delete({ where: { id: postId } });
  }

  /** Fil d'actualité : posts de l'utilisateur et de ses amis (US-8.1). */
  async getFeed(userId: string, cursor?: string, take = 20): Promise<PostPage> {
    const friendIds = await this.getFriendIds(userId);
    return this.paginate(
      { authorId: { in: [...friendIds, userId] } },
      userId,
      cursor,
      take,
    );
  }

  /** Posts d'un utilisateur donné, affichés publiquement sur son profil (US-8.4). */
  async getByAuthorId(
    authorId: string,
    viewerId: string,
    cursor?: string,
    take = 20,
  ): Promise<PostPage> {
    return this.paginate({ authorId }, viewerId, cursor, take);
  }

  private async getFriendIds(userId: string): Promise<string[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
    });
    return friendships.map((friendship) =>
      friendship.requesterId === userId
        ? friendship.addresseeId
        : friendship.requesterId,
    );
  }

  /**
   * Pagination par curseur (première du projet) : le tri composite
   * `(createdAt, id)` lève l'ambiguïté d'égalité de timestamp entre deux
   * posts créés à la même milliseconde, condition d'un curseur stable.
   */
  private async paginate(
    where: Prisma.PostWhereInput,
    viewerId: string,
    cursor: string | undefined,
    take: number,
  ): Promise<PostPage> {
    const posts = await this.prisma.post.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: take + 1,
      include: POST_INCLUDE(viewerId),
    });

    const hasMore = posts.length > take;
    const items = posts.slice(0, take).map((post) => this.toSummary(post));

    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  /** `likedByMe` reflète déjà le filtre `likes: { where: { userId: viewerId } }` de la requête. */
  private toSummary(post: PostWithRelations): PostSummary {
    return {
      id: post.id,
      type: post.type,
      author: post.author,
      concert: post.concert,
      content: post.content,
      ratingValue: post.ratingValue,
      photos: post.photos.map((photo) => ({ id: photo.id, url: photo.url })),
      video: post.video
        ? {
            id: post.video.id,
            status: post.video.status,
            url: post.video.playbackUrl,
            posterUrl: post.video.posterUrl,
            durationSeconds: post.video.durationSeconds,
          }
        : null,
      likeCount: post._count.likes,
      likedByMe: post.likes.length > 0,
      createdAt: post.createdAt.toISOString(),
    };
  }
}
