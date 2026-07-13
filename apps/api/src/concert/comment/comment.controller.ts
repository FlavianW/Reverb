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
import { CommentService } from './comment.service';

/** Suppression d'un commentaire (US-2.4). La création vit sous `/concerts/:id/comments`. */
@Controller('comments')
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
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
    await this.commentService.delete(id, user.id);
  }

  /** Signale un commentaire (US-6.1). */
  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  async report(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReportDto,
    @Req() req: Request,
  ): Promise<Report> {
    const user = req.user as PublicUser;
    return this.reportService.reportComment(id, user.id, dto.reason);
  }
}
