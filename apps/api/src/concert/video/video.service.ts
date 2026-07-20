import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ConcertVideoSummary,
  PresignVideoUploadResponse,
} from '@reverb/shared';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MAX_VIDEO_SIZE_BYTES,
  VIDEO_EXTENSION_BY_MIME_TYPE,
  isAllowedVideoMimeType,
} from '../../media/video-upload.config';
import { S3Service } from '../../media/s3.service';

/** Gère l'upload et la galerie vidéo d'un concert (US-5.1). */
@Injectable()
export class ConcertVideoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  /** Génère une URL d'upload direct navigateur/app → S3, sous la clé `concerts/{concertId}/{uuid}/original.ext`. */
  async presignUpload(
    concertId: string,
    contentType: string,
  ): Promise<PresignVideoUploadResponse> {
    if (!isAllowedVideoMimeType(contentType)) {
      throw new BadRequestException(
        'Format vidéo non supporté (MP4 ou MOV attendu).',
      );
    }
    const extension = VIDEO_EXTENSION_BY_MIME_TYPE[contentType];
    const key = `concerts/${concertId}/${randomUUID()}/original.${extension}`;
    const { url, fields } = await this.s3Service.createPresignedUpload(
      key,
      contentType,
      MAX_VIDEO_SIZE_BYTES,
    );
    return { uploadUrl: url, fields, key };
  }

  /** Confirme qu'un upload est terminé et crée la ligne `Video` (statut `PROCESSING`). */
  async confirmUpload(
    concertId: string,
    userId: string,
    key: string,
  ): Promise<ConcertVideoSummary> {
    if (!key.startsWith(`concerts/${concertId}/`)) {
      throw new ForbiddenException("Cette clé n'appartient pas à ce concert.");
    }
    if (!(await this.s3Service.headObject(key))) {
      throw new BadRequestException(
        "La vidéo n'a pas été trouvée dans le stockage — vérifiez que l'upload est terminé.",
      );
    }

    const video = await this.prisma.video.create({
      data: { key, concertId, uploadedById: userId },
      include: { uploadedBy: { select: { pseudo: true } } },
    });
    return this.toSummary(video);
  }

  async findByConcert(concertId: string): Promise<ConcertVideoSummary[]> {
    const videos = await this.prisma.video.findMany({
      where: { concertId },
      orderBy: { createdAt: 'desc' },
      include: { uploadedBy: { select: { pseudo: true } } },
    });
    return videos.map((video) => this.toSummary(video));
  }

  async delete(videoId: string, userId: string): Promise<void> {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });
    if (!video) {
      throw new NotFoundException('Vidéo introuvable.');
    }
    if (video.postId) {
      throw new ForbiddenException(
        'Cette vidéo appartient à un post ; supprimez le post pour la retirer.',
      );
    }
    if (video.uploadedById !== userId) {
      throw new ForbiddenException("Seul l'auteur peut supprimer cette vidéo.");
    }

    await this.s3Service.deleteObject(video.key);
    if (video.playbackKey) {
      await this.s3Service.deleteObject(video.playbackKey);
    }
    if (video.posterKey) {
      await this.s3Service.deleteObject(video.posterKey);
    }
    await this.prisma.video.delete({ where: { id: videoId } });
  }

  private toSummary(video: {
    id: string;
    status: string;
    playbackUrl: string | null;
    posterUrl: string | null;
    durationSeconds: number | null;
    createdAt: Date;
    uploadedBy: { pseudo: string };
  }): ConcertVideoSummary {
    return {
      id: video.id,
      status: video.status as ConcertVideoSummary['status'],
      url: video.playbackUrl,
      posterUrl: video.posterUrl,
      durationSeconds: video.durationSeconds,
      pseudo: video.uploadedBy.pseudo,
      createdAt: video.createdAt.toISOString(),
    };
  }
}
