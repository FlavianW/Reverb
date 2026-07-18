import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  ConversationSummary,
  MessagePage,
  MessageSummary,
  PublicUser,
} from '@reverb/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ListMessagesDto } from './dto/list-messages.dto';
import { SendMessageDto } from './dto/send-message.dto';

/** Conversations privées et messages (US-10.x). */
@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get()
  listConversations(
    @CurrentUser() user: PublicUser,
  ): Promise<ConversationSummary[]> {
    return this.chatService.listConversations(user.id);
  }

  @Get('unread-count')
  async getUnreadCount(
    @CurrentUser() user: PublicUser,
  ): Promise<{ count: number }> {
    const count = await this.chatService.getUnreadCount(user.id);
    return { count };
  }

  /** Retrouve la conversation avec cet ami ou la crée (US-10.1). */
  @Post(':pseudo')
  startConversation(
    @Param('pseudo') pseudo: string,
    @CurrentUser() user: PublicUser,
  ): Promise<ConversationSummary> {
    return this.chatService.findOrCreateConversation(user.id, pseudo);
  }

  @Get(':id/messages')
  getMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListMessagesDto,
    @CurrentUser() user: PublicUser,
  ): Promise<MessagePage> {
    return this.chatService.getMessages(user.id, id, query.cursor, query.take);
  }

  /**
   * Envoi REST (repli non-socket) : persiste puis diffuse aux clients
   * connectés à la room de la conversation, comme l'event WS `sendMessage`.
   */
  @Post(':id/messages')
  async sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: PublicUser,
  ): Promise<MessageSummary> {
    const message = await this.chatService.sendMessage(
      user.id,
      id,
      dto.content,
    );
    this.chatGateway.emitMessageToConversation(id, message);
    return message;
  }

  @Put(':id/read')
  @HttpCode(204)
  async markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: PublicUser,
  ): Promise<void> {
    await this.chatService.markRead(user.id, id);
  }
}
