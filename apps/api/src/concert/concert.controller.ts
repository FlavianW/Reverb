import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Concert } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { PublicUser } from '../user/user.service';
import { ConcertAttendanceService } from './attendance/concert-attendance.service';
import { ConcertPage, ConcertService } from './concert.service';
import { CreateConcertDto } from './dto/create-concert.dto';

@Controller('concerts')
export class ConcertController {
  constructor(
    private readonly concertService: ConcertService,
    private readonly attendanceService: ConcertAttendanceService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateConcertDto, @Req() req: Request): Promise<Concert> {
    const user = req.user as PublicUser;
    return this.concertService.create(
      {
        artistName: dto.artistName,
        venueName: dto.venueName,
        city: dto.city,
        date: new Date(dto.date),
      },
      user.id,
    );
  }

  /**
   * Page concert enrichie de sa setlist (US-2.1). `setlist: null` signifie
   * « setlist non disponible » — concert à venir ou absent de Setlist.fm.
   */
  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<ConcertPage> {
    const concert = await this.concertService.findPageById(id);
    if (!concert) {
      throw new NotFoundException('Concert introuvable.');
    }
    return concert;
  }

  /** Statut « J'y étais » de l'utilisateur connecté pour ce concert (US-2.2). */
  @Get(':id/attendance')
  @UseGuards(JwtAuthGuard)
  async getAttendance(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<{ attending: boolean }> {
    await this.assertConcertExists(id);
    const user = req.user as PublicUser;
    const attending = await this.attendanceService.isAttendedBy(id, user.id);
    return { attending };
  }

  /** Active « J'y étais » pour l'utilisateur connecté (idempotent). */
  @Put(':id/attendance')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async markAttendance(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<void> {
    await this.assertConcertExists(id);
    const user = req.user as PublicUser;
    await this.attendanceService.markAttended(id, user.id);
  }

  /** Retire « J'y étais » pour l'utilisateur connecté (idempotent). */
  @Delete(':id/attendance')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async unmarkAttendance(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<void> {
    await this.assertConcertExists(id);
    const user = req.user as PublicUser;
    await this.attendanceService.unmarkAttended(id, user.id);
  }

  private async assertConcertExists(id: string): Promise<void> {
    if (!(await this.concertService.exists(id))) {
      throw new NotFoundException('Concert introuvable.');
    }
  }
}
