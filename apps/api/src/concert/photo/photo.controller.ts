import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { PublicUser } from '../../user/user.service';
import { PhotoService } from './photo.service';

/** Suppression d'une photo (US-5.1). L'upload vit sous `/concerts/:id/photos`. */
@Controller('photos')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

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
}
