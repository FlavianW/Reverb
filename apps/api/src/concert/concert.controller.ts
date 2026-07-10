import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Comment, Concert } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { PublicUser } from '../user/user.service';
import { ConcertAttendanceService } from './attendance/concert-attendance.service';
import { ConcertPage, ConcertService } from './concert.service';
import { CommentService } from './comment/comment.service';
import { CreateCommentDto } from './comment/dto/create-comment.dto';
import { CreateConcertDto } from './dto/create-concert.dto';
import { SearchConcertsDto } from './dto/search-concerts.dto';
import { PhotoService, PhotoSummary } from './photo/photo.service';
import { ConcertRatingService } from './rating/concert-rating.service';
import { RateConcertDto } from './rating/dto/rate-concert.dto';

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

@Controller('concerts')
export class ConcertController {
  constructor(
    private readonly concertService: ConcertService,
    private readonly attendanceService: ConcertAttendanceService,
    private readonly ratingService: ConcertRatingService,
    private readonly commentService: CommentService,
    private readonly photoService: PhotoService,
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
   * Recherche des concerts par artiste ou par salle (US-3.1). Déclarée avant
   * `:id` pour que « search » ne soit pas intercepté comme un identifiant.
   */
  @Get('search')
  search(@Query() dto: SearchConcertsDto): Promise<Concert[]> {
    return this.concertService.search(dto.q);
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

  /** Crée ou remplace la note (1 à 5) de l'utilisateur connecté (US-2.3). */
  @Put(':id/rating')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async rate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RateConcertDto,
    @Req() req: Request,
  ): Promise<void> {
    await this.assertConcertExists(id);
    const user = req.user as PublicUser;
    await this.ratingService.rate(id, user.id, dto.value);
  }

  /** Ajoute un commentaire au concert (US-2.4). */
  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentDto,
    @Req() req: Request,
  ): Promise<Comment> {
    await this.assertConcertExists(id);
    const user = req.user as PublicUser;
    return this.commentService.create(id, user.id, dto.content);
  }

  /** Ajoute une photo à la galerie du concert (US-5.1). */
  @Post(':id/photos')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async addPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /^(image\/jpeg|image\/png|image\/webp)$/,
        })
        .addMaxSizeValidator({ maxSize: MAX_PHOTO_SIZE_BYTES })
        .build({ errorHttpStatusCode: 400 }),
    )
    file: Express.Multer.File,
    @Req() req: Request,
  ): Promise<PhotoSummary> {
    await this.assertConcertExists(id);
    const user = req.user as PublicUser;
    return this.photoService.uploadForConcert(id, user.id, file);
  }

  private async assertConcertExists(id: string): Promise<void> {
    if (!(await this.concertService.exists(id))) {
      throw new NotFoundException('Concert introuvable.');
    }
  }
}
