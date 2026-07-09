import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Concert } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { PublicUser } from '../user/user.service';
import { ConcertPage, ConcertService } from './concert.service';
import { CreateConcertDto } from './dto/create-concert.dto';

@Controller('concerts')
export class ConcertController {
  constructor(private readonly concertService: ConcertService) {}

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
}
