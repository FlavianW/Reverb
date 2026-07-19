import { IsUUID } from 'class-validator';
import { SendMessageDto } from './send-message.dto';

/**
 * Payload WS `sendMessage` : mêmes contraintes sur `content` que l'envoi REST
 * (hérité de `SendMessageDto`), plus l'identifiant de conversation que le REST
 * porte dans l'URL.
 */
export class SendMessageWsDto extends SendMessageDto {
  @IsUUID()
  conversationId!: string;
}
