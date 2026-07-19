import { IsUUID } from 'class-validator';

/** Payload WS `joinConversation` — pendant WebSocket du `ParseUUIDPipe` des routes REST. */
export class JoinConversationDto {
  @IsUUID()
  conversationId!: string;
}
