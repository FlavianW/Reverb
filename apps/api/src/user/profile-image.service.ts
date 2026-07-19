import { randomUUID } from 'node:crypto';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { PublicUser } from '@reverb/shared';
import { S3Service } from '../media/s3.service';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicUser } from './user.service';

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Avatar ou bannière : même flux d'upload, seuls le préfixe S3 et la colonne diffèrent. */
export type ProfileImageKind = 'avatar' | 'banner';

const KIND_CONFIG: Record<
  ProfileImageKind,
  { keyPrefix: string; label: string }
> = {
  avatar: { keyPrefix: 'avatars', label: "de l'avatar" },
  banner: { keyPrefix: 'banners', label: 'de la bannière' },
};

/**
 * Gère les images de profil — avatar et bannière (US-4.1). Limite connue :
 * `User` n'a pas de colonne pour la clé S3, donc remplacer une image laisse
 * l'ancien objet S3 orphelin — accepté pour le MVP, pas de migration ici.
 */
@Injectable()
export class ProfileImageService {
  private readonly logger = new Logger(ProfileImageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async uploadForUser(
    kind: ProfileImageKind,
    userId: string,
    file: Express.Multer.File,
  ): Promise<PublicUser> {
    const { keyPrefix, label } = KIND_CONFIG[kind];
    const extension = EXTENSION_BY_MIME_TYPE[file.mimetype] ?? 'jpg';
    const key = `${keyPrefix}/${userId}/${randomUUID()}.${extension}`;

    let url: string;
    try {
      url = await this.s3Service.uploadObject(key, file.buffer, file.mimetype);
    } catch (error) {
      this.logger.error(
        `Échec de l'upload S3 ${label} pour l'utilisateur ${userId}`,
        error instanceof Error ? error.stack : error,
      );
      throw new ServiceUnavailableException(
        'Le service de stockage est momentanément indisponible.',
      );
    }

    const data: Prisma.UserUpdateInput =
      kind === 'avatar' ? { avatarUrl: url } : { bannerUrl: url };
    const user = await this.prisma.user.update({ where: { id: userId }, data });

    return toPublicUser(user);
  }
}
