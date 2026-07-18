/** Représentation minimale de « l'autre » utilisateur dans une conversation. */
export interface ChatUserSummary {
  pseudo: string;
  avatarUrl: string | null;
}

/** Message tel qu'affiché dans un fil de discussion (US-10.1). */
export interface MessageSummary {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

/**
 * Page de messages, du plus ancien au plus récent (ordre d'affichage direct) ;
 * `nextCursor` pointe vers des messages encore plus anciens (US-10.2).
 */
export interface MessagePage {
  items: MessageSummary[];
  nextCursor: string | null;
}

/** Ligne de la liste des conversations (US-10.2, US-10.3). */
export interface ConversationSummary {
  id: string;
  otherUser: ChatUserSummary;
  lastMessage: MessageSummary | null;
  unreadCount: number;
  updatedAt: string;
}

/**
 * Contrat d'évènements Socket.IO, partagé entre la gateway (API) et le client
 * (`socket.io-client`, web), pour que les deux bouts restent en phase.
 */
export interface ChatServerToClientEvents {
  'message:new': (message: MessageSummary) => void;
}

export interface ChatClientToServerEvents {
  joinConversation: (payload: { conversationId: string }) => void;
  sendMessage: (payload: { conversationId: string; content: string }) => void;
}
