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
import { CommentService } from './comment.service';

/** Suppression d'un commentaire (US-2.4). La création vit sous `/concerts/:id/comments`. */
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

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
}
