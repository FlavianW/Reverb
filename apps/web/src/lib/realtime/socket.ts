import { io, type Socket } from 'socket.io-client';
import { PUBLIC_API_URL } from '$env/static/public';
import type { ChatClientToServerEvents, ChatServerToClientEvents } from '@reverb/shared';

export type ChatSocket = Socket<ChatServerToClientEvents, ChatClientToServerEvents>;

/**
 * À appeler uniquement depuis `onMount` (jamais au niveau module) : ouvre la
 * connexion WebSocket authentifiée par le cookie de session (US-10.1).
 */
export function createChatSocket(): ChatSocket {
	return io(`${PUBLIC_API_URL}/chat`, { withCredentials: true });
}
