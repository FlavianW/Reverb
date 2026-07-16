import { randomUUID } from 'node:crypto';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { PublicUser } from '@reverb/shared';
import { S3Service } from '../../media/s3.service';
import { PrismaService } from '../../prisma/prisma.service';
import { toPublicUser } from '../user.service';

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Gère l'avatar de profil (US-4.1). Comme `PhotoService`, mais pour
 * `User.avatarUrl` plutôt que la galerie d'un concert. Limite connue :
 * `User` n'a pas de colonne `avatarKey`, donc remplacer un avatar laisse
 * l'ancien objet S3 orphelin — accepté pour le MVP, pas de migration ici.
 */
@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async uploadForUser(
    userId: string,
    file: Express.Multer.File,
  ): Promise<PublicUser> {
    const extension = EXTENSION_BY_MIME_TYPE[file.mimetype] ?? 'jpg';
    const key = `avatars/${userId}/${randomUUID()}.${extension}`;

    let url: string;
    try {
      url = await this.s3Service.uploadObject(key, file.buffer, file.mimetype);
    } catch (error) {
      this.logger.error(
        `Échec de l'upload S3 de l'avatar pour l'utilisateur ${userId}`,
        error instanceof Error ? error.stack : error,
      );
      throw new ServiceUnavailableException(
        'Le service de stockage est momentanément indisponible.',
      );
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: url },
    });

    return toPublicUser(user);
  }
}
