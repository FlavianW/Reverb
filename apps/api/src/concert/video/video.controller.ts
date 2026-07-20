import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Report } from '@prisma/client';
import type { PublicUser } from '@reverb/shared';
import { CurrentUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CreateReportDto } from '../report/dto/create-report.dto';
import { ReportService } from '../report/report.service';
import { ConcertVideoService } from './video.service';

/** Suppression et signalement d'une vidéo (US-5.1, US-6.1). L'upload vit sous `/concerts/:id/videos`. */
@Controller('videos')
export class VideoController {
  constructor(
    private readonly videoService: ConcertVideoService,
    private readonly reportService: ReportService,
  ) {}

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: PublicUser,
  ): Promise<void> {
    await this.videoService.delete(id, user.id);
  }

  /** Signale une vidéo (US-6.1). */
  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  async report(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReportDto,
    @CurrentUser() user: PublicUser,
  ): Promise<Report> {
    return this.reportService.reportVideo(id, user.id, dto.reason);
  }
}
