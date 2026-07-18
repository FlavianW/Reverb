import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { UserService } from '../user/user.service';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let jwtService: { verifyAsync: jest.Mock };
  let configService: { getOrThrow: jest.Mock };
  let userService: { findById: jest.Mock };
  let chatService: { assertParticipant: jest.Mock; sendMessage: jest.Mock };

  const user = { id: 'user-1', pseudo: 'ana-etoile' };

  const createFakeClient = (cookie?: string) => ({
    handshake: { headers: { cookie } },
    data: {} as { user?: typeof user },
    join: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
  });

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() };
    configService = { getOrThrow: jest.fn().mockReturnValue('secret') };
    userService = { findById: jest.fn() };
    chatService = { assertParticipant: jest.fn(), sendMessage: jest.fn() };

    gateway = new ChatGateway(
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
      userService as unknown as UserService,
      chatService as unknown as ChatService,
    );
  });

  describe('handleConnection', () => {
    it('authentifie le socket et peuple client.data.user avec un cookie valide', async () => {
      const client = createFakeClient('reverb_session=valid-jwt');
      jwtService.verifyAsync.mockResolvedValueOnce({ sub: user.id });
      userService.findById.mockResolvedValueOnce({
        id: user.id,
        pseudo: user.pseudo,
        email: 'ana@example.com',
        avatarUrl: null,
        bio: null,
      });

      await gateway.handleConnection(client as never);

      expect(client.data.user).toEqual(
        expect.objectContaining({ id: user.id, pseudo: user.pseudo }),
      );
      expect(client.disconnect).not.toHaveBeenCalled();
      expect(client.emit).toHaveBeenCalledWith('ready');
    });

    it('déconnecte le socket si aucun cookie de session n’est présent', async () => {
      const client = createFakeClient(undefined);

      await gateway.handleConnection(client as never);

      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(client.data.user).toBeUndefined();
    });

    it('déconnecte le socket si le token est invalide', async () => {
      const client = createFakeClient('reverb_session=invalide');
      jwtService.verifyAsync.mockRejectedValueOnce(new Error('invalid token'));

      await gateway.handleConnection(client as never);

      expect(client.disconnect).toHaveBeenCalledWith(true);
    });

    it("déconnecte le socket si l'utilisateur n'existe plus", async () => {
      const client = createFakeClient('reverb_session=valid-jwt');
      jwtService.verifyAsync.mockResolvedValueOnce({ sub: user.id });
      userService.findById.mockResolvedValueOnce(null);

      await gateway.handleConnection(client as never);

      expect(client.disconnect).toHaveBeenCalledWith(true);
    });
  });

  describe('handleJoin', () => {
    it('rejoint la room après vérification de la participation', async () => {
      const client = createFakeClient();
      client.data.user = user;
      chatService.assertParticipant.mockResolvedValueOnce({});

      await gateway.handleJoin(client as never, { conversationId: 'conv-1' });

      expect(chatService.assertParticipant).toHaveBeenCalledWith(
        user.id,
        'conv-1',
      );
      expect(client.join).toHaveBeenCalledWith('conversation:conv-1');
    });

    it('rejette avec WsException si le client n’est pas authentifié', async () => {
      const client = createFakeClient();

      await expect(
        gateway.handleJoin(client as never, { conversationId: 'conv-1' }),
      ).rejects.toThrow(WsException);
      expect(client.join).not.toHaveBeenCalled();
    });

    it('traduit un refus de ChatService en WsException', async () => {
      const client = createFakeClient();
      client.data.user = user;
      chatService.assertParticipant.mockRejectedValueOnce(
        new ForbiddenException('Vous ne participez pas à cette conversation.'),
      );

      await expect(
        gateway.handleJoin(client as never, { conversationId: 'conv-1' }),
      ).rejects.toThrow(WsException);
    });
  });

  describe('handleSendMessage', () => {
    it('persiste puis diffuse le message à la room de la conversation', async () => {
      const client = createFakeClient();
      client.data.user = user;
      const message = {
        id: 'm1',
        conversationId: 'conv-1',
        senderId: user.id,
        content: 'salut',
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      chatService.sendMessage.mockResolvedValueOnce(message);
      const emit = jest.fn();
      const to = jest.fn().mockReturnValue({ emit });
      (gateway as unknown as { server: { to: typeof to } }).server = { to };

      const result = await gateway.handleSendMessage(client as never, {
        conversationId: 'conv-1',
        content: 'salut',
      });

      expect(chatService.sendMessage).toHaveBeenCalledWith(
        user.id,
        'conv-1',
        'salut',
      );
      expect(to).toHaveBeenCalledWith('conversation:conv-1');
      expect(emit).toHaveBeenCalledWith('message:new', message);
      expect(result).toBe(message);
    });
  });
});
