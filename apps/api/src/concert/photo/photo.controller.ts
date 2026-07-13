import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Report } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { PublicUser } from '../../user/user.service';
import { CreateReportDto } from '../report/dto/create-report.dto';
import { ReportService } from '../report/report.service';
import { PhotoService } from './photo.service';

/** Suppression d'une photo (US-5.1). L'upload vit sous `/concerts/:id/photos`. */
@Controller('photos')
export class PhotoController {
  constructor(
    private readonly photoService: PhotoService,
    private readonly reportService: ReportService,
  ) {}

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<void> {
    const user = req.user as PublicUser;
    await this.photoService.delete(id, user.id);
  }

  /** Signale une photo (US-6.1). */
  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  async report(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReportDto,
    @Req() req: Request,
  ): Promise<Report> {
    const user = req.user as PublicUser;
    return this.reportService.reportPhoto(id, user.id, dto.reason);
  }
}
