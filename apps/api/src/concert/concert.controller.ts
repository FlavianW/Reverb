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
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Comment, Concert } from '@prisma/client';
import type { PublicUser } from '@reverb/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { buildImageFileValidator } from '../media/image-upload.validator';
import { ConcertAttendanceService } from './attendance/concert-attendance.service';
import {
  ConcertPage,
  ConcertSearchResult,
  ConcertService,
  NearbyConcert,
} from './concert.service';
import { CommentService } from './comment/comment.service';
import { CreateCommentDto } from './comment/dto/create-comment.dto';
import { CreateConcertDto } from './dto/create-concert.dto';
import { NearbyConcertsDto } from './dto/nearby-concerts.dto';
import { SearchConcertsDto } from './dto/search-concerts.dto';
import { PhotoService, PhotoSummary } from './photo/photo.service';
import { ConcertRatingService } from './rating/concert-rating.service';
import { RateConcertDto } from './rating/dto/rate-concert.dto';

@Controller('concerts')
export class ConcertController {
  constructor(
    private readonly concertService: ConcertService,
    private readonly attendanceService: ConcertAttendanceService,
    private readonly ratingService: ConcertRatingService,
    private readonly commentService: CommentService,
    private readonly photoService: PhotoService,
  ) {}

  /** Crée une page concert saisie manuellement (US-2.1), géocodée pour la carte (US-9.1). */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() dto: CreateConcertDto,
    @CurrentUser() user: PublicUser,
  ): Promise<Concert> {
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
   * Recherche des concerts par artiste ou par salle (US-3.1). Déclarée avant
   * `:id` pour que « search » ne soit pas intercepté comme un identifiant.
   * Authentifiée car elle importe des concerts sous l'utilisateur courant :
   * ceux trouvés sur Setlist.fm pour une requête non vide, les concerts
   * récents en France sinon (voir `ConcertService#search`).
   */
  @Get('search')
  @UseGuards(JwtAuthGuard)
  search(
    @Query() dto: SearchConcertsDto,
    @CurrentUser() user: PublicUser,
  ): Promise<ConcertSearchResult[]> {
    return this.concertService.search(dto.q, user.id);
  }

  /**
   * Concerts avec coordonnées connues à proximité d'un point (US-9.1), triés
   * du plus proche au plus lointain. Déclarée avant `:id` pour que « nearby »
   * ne soit pas intercepté comme un identifiant. Pas d'effet de bord par
   * utilisateur (contrairement à `search`) : pas de guard, comme `:id`.
   */
  @Get('nearby')
  findNearby(@Query() dto: NearbyConcertsDto): Promise<NearbyConcert[]> {
    return this.concertService.findNearby(dto.lat, dto.lng, dto.radiusKm);
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
    @CurrentUser() user: PublicUser,
  ): Promise<{ attending: boolean }> {
    await this.assertConcertExists(id);
    const attending = await this.attendanceService.isAttendedBy(id, user.id);
    return { attending };
  }

  /** Active « J'y étais » pour l'utilisateur connecté (idempotent). */
  @Put(':id/attendance')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async markAttendance(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: PublicUser,
  ): Promise<void> {
    await this.assertConcertExists(id);
    await this.attendanceService.markAttended(id, user.id);
  }

  /** Retire « J'y étais » pour l'utilisateur connecté (idempotent). */
  @Delete(':id/attendance')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async unmarkAttendance(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: PublicUser,
  ): Promise<void> {
    await this.assertConcertExists(id);
    await this.attendanceService.unmarkAttended(id, user.id);
  }

  /** Crée ou remplace la note (1 à 5) de l'utilisateur connecté (US-2.3). */
  @Put(':id/rating')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async rate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RateConcertDto,
    @CurrentUser() user: PublicUser,
  ): Promise<void> {
    await this.assertConcertExists(id);
    await this.ratingService.rate(id, user.id, dto.value);
  }

  /** Ajoute un commentaire au concert (US-2.4). */
  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: PublicUser,
  ): Promise<Comment> {
    await this.assertConcertExists(id);
    return this.commentService.create(id, user.id, dto.content);
  }

  /** Ajoute une photo à la galerie du concert (US-5.1). */
  @Post(':id/photos')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async addPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(buildImageFileValidator()) file: Express.Multer.File,
    @CurrentUser() user: PublicUser,
  ): Promise<PhotoSummary> {
    await this.assertConcertExists(id);
    return this.photoService.uploadForConcert(id, user.id, file);
  }

  private async assertConcertExists(id: string): Promise<void> {
    if (!(await this.concertService.exists(id))) {
      throw new NotFoundException('Concert introuvable.');
    }
  }
}
