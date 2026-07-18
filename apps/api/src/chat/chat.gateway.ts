import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import type {
  ChatClientToServerEvents,
  ChatServerToClientEvents,
  MessageSummary,
  PublicUser,
} from '@reverb/shared';
import type { DefaultEventsMap, Server, Socket } from 'socket.io';
import { SessionTokenPayload } from '../auth/auth.service';
import { SESSION_COOKIE_NAME } from '../auth/session-cookie';
import { toPublicUser, UserService } from '../user/user.service';
import { ChatService } from './chat.service';

/** Peuplé dans `handleConnection` : l'utilisateur authentifié pour ce socket. */
interface ChatSocketData {
  user?: PublicUser;
}

type ChatServer = Server<ChatClientToServerEvents, ChatServerToClientEvents>;
type ChatSocket = Socket<
  ChatClientToServerEvents,
  ChatServerToClientEvents,
  DefaultEventsMap,
  ChatSocketData
>;

function conversationRoom(conversationId: string): string {
  return `conversation:${conversationId}`;
}

/**
 * Extrait un cookie nommé d'un en-tête `Cookie` brut. Pas de dépendance
 * dédiée (`cookie` v2 est un module ESM pur, incompatible avec la
 * transformation CommonJS de Jest) pour une tâche aussi simple.
 */
function extractCookie(cookieHeader: string, name: string): string | undefined {
  for (const part of cookieHeader.split(';')) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }
    if (part.slice(0, separatorIndex).trim() === name) {
      return decodeURIComponent(part.slice(separatorIndex + 1).trim());
    }
  }
  return undefined;
}

/**
 * Diffusion temps réel des messages (US-10.1). Pas de framework de garde WS
 * dans ce repo : l'authentification se fait à la connexion en relisant le
 * même cookie de session que l'auth HTTP (`reverb_session`), vérifié avec
 * le même `JwtService`/`JWT_SECRET` que `JwtStrategy`.
 */
@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: (process.env.CORS_ORIGIN ?? '').split(','),
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() private readonly server!: ChatServer;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: ChatSocket): Promise<void> {
    try {
      const cookieHeader = client.handshake.headers.cookie ?? '';
      const token = extractCookie(cookieHeader, SESSION_COOKIE_NAME);
      if (!token) {
        throw new Error('Aucun cookie de session.');
      }

      const payload = await this.jwtService.verifyAsync<SessionTokenPayload>(
        token,
        { secret: this.configService.getOrThrow<string>('JWT_SECRET') },
      );
      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new Error('Utilisateur introuvable.');
      }

      client.data.user = toPublicUser(user);
      // Le client doit attendre cet évènement avant d'émettre `joinConversation` :
      // sans lui, un envoi immédiat après connexion pourrait arriver avant la
      // fin de cette vérification asynchrone (JWT + lookup utilisateur).
      client.emit('ready');
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('joinConversation')
  async handleJoin(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() { conversationId }: { conversationId: string },
  ): Promise<void> {
    const user = this.requireUser(client);
    await this.guarded(() =>
      this.chatService.assertParticipant(user.id, conversationId),
    );
    await client.join(conversationRoom(conversationId));
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody()
    { conversationId, content }: { conversationId: string; content: string },
  ): Promise<MessageSummary> {
    const user = this.requireUser(client);
    const message = await this.guarded(() =>
      this.chatService.sendMessage(user.id, conversationId, content),
    );
    this.emitMessageToConversation(conversationId, message);
    return message;
  }

  /** Appelée aussi par `ChatController` pour l'envoi via REST (US-10.1). */
  emitMessageToConversation(
    conversationId: string,
    message: MessageSummary,
  ): void {
    this.server
      .to(conversationRoom(conversationId))
      .emit('message:new', message);
  }

  private requireUser(client: ChatSocket): PublicUser {
    if (!client.data.user) {
      throw new WsException('Non authentifié.');
    }
    return client.data.user;
  }

  /** Traduit les exceptions HTTP de ChatService en WsException (pas de garde WS dédiée dans ce repo). */
  private async guarded<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof HttpException) {
        throw new WsException(error.message);
      }
      throw error;
    }
  }
}
