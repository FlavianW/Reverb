import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../media/s3.service';

/** Photo telle qu'exposée au client, avec le pseudo de son auteur. */
export interface PhotoSummary {
  id: string;
  url: string;
  pseudo: string;
  createdAt: Date;
}

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Gère la galerie photo d'un concert (US-5.1). */
@Injectable()
export class PhotoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async uploadForConcert(
    concertId: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<PhotoSummary> {
    const extension = EXTENSION_BY_MIME_TYPE[file.mimetype] ?? 'jpg';
    const key = `concerts/${concertId}/${randomUUID()}.${extension}`;
    const url = await this.s3Service.uploadObject(
      key,
      file.buffer,
      file.mimetype,
    );

    const photo = await this.prisma.photo.create({
      data: { key, url, concertId, uploadedById: userId },
      include: { uploadedBy: { select: { pseudo: true } } },
    });

    return {
      id: photo.id,
      url: photo.url,
      pseudo: photo.uploadedBy.pseudo,
      createdAt: photo.createdAt,
    };
  }

  async findByConcert(concertId: string): Promise<PhotoSummary[]> {
    const photos = await this.prisma.photo.findMany({
      where: { concertId },
      orderBy: { createdAt: 'desc' },
      include: { uploadedBy: { select: { pseudo: true } } },
    });

    return photos.map((photo) => ({
      id: photo.id,
      url: photo.url,
      pseudo: photo.uploadedBy.pseudo,
      createdAt: photo.createdAt,
    }));
  }
}
