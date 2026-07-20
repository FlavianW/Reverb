import {
  Body,
  Controller,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { VideoTranscodeCompleteDto } from './dto/video-transcode-complete.dto';
import { InternalWebhookGuard } from './internal-webhook.guard';
import { S3Service } from './s3.service';

/**
 * Callback du Lambda de transcodage (US-8.2, US-5.1) : le Lambda est
 * déclenché par un événement S3, indépendant du cycle de vie de l'API, donc
 * il notifie la fin du traitement plutôt que d'être appelé de façon synchrone.
 */
@Controller('internal/videos')
@UseGuards(InternalWebhookGuard)
export class InternalVideoController {
  private readonly logger = new Logger(InternalVideoController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  @Post(':id/complete')
  @HttpCode(204)
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VideoTranscodeCompleteDto,
  ): Promise<void> {
    await this.updateOrNotFound(id, {
      status: 'READY',
      playbackKey: dto.playbackKey,
      playbackUrl: this.s3Service.publicUrl(dto.playbackKey),
      posterKey: dto.posterKey,
      posterUrl: this.s3Service.publicUrl(dto.posterKey),
      durationSeconds: dto.durationSeconds,
    });
  }

  @Post(':id/fail')
  @HttpCode(204)
  async fail(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.updateOrNotFound(id, { status: 'FAILED' });
  }

  private async updateOrNotFound(
    id: string,
    data: Prisma.VideoUpdateInput,
  ): Promise<void> {
    try {
      await this.prisma.video.update({ where: { id }, data });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Vidéo introuvable.');
      }
      this.logger.error(
        `Échec de la mise à jour du statut pour la vidéo ${id}`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }
}
