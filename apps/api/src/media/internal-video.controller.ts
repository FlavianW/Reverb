import {
  Body,
  Controller,
  HttpCode,
  Logger,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { VideoTranscodeCompleteDto } from './dto/video-transcode-complete.dto';
import { VideoTranscodeFailDto } from './dto/video-transcode-fail.dto';
import { InternalWebhookGuard } from './internal-webhook.guard';
import { S3Service } from './s3.service';

/**
 * Callback du Lambda de transcodage (US-8.2, US-5.1) : le Lambda est
 * déclenché par un événement S3, indépendant du cycle de vie de l'API, donc
 * il notifie la fin du traitement plutôt que d'être appelé de façon
 * synchrone. Identifié par la clé S3 de l'original (`originalKey`), pas par
 * l'id de la ligne `Video` : c'est la seule information que le Lambda
 * connaît de la vidéo.
 */
@Controller('internal/videos')
@UseGuards(InternalWebhookGuard)
export class InternalVideoController {
  private readonly logger = new Logger(InternalVideoController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  @Post('complete')
  @HttpCode(204)
  async complete(@Body() dto: VideoTranscodeCompleteDto): Promise<void> {
    await this.updateOrNotFound(dto.originalKey, {
      status: 'READY',
      playbackKey: dto.playbackKey,
      playbackUrl: this.s3Service.publicUrl(dto.playbackKey),
      posterKey: dto.posterKey,
      posterUrl: this.s3Service.publicUrl(dto.posterKey),
      durationSeconds: dto.durationSeconds,
    });
  }

  @Post('fail')
  @HttpCode(204)
  async fail(@Body() dto: VideoTranscodeFailDto): Promise<void> {
    await this.updateOrNotFound(dto.originalKey, { status: 'FAILED' });
  }

  private async updateOrNotFound(
    originalKey: string,
    data: Prisma.VideoUpdateInput,
  ): Promise<void> {
    try {
      await this.prisma.video.update({ where: { key: originalKey }, data });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Vidéo introuvable.');
      }
      this.logger.error(
        `Échec de la mise à jour du statut pour la vidéo ${originalKey}`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }
}
