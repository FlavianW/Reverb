/**
 * Union de littéraux indépendante de Prisma (ce package est aussi consommé
 * par le navigateur). Reflète `enum FriendshipStatus` dans
 * `apps/api/prisma/schema.prisma`.
 */
export const FRIENDSHIP_STATUSES = ['PENDING', 'ACCEPTED'] as const;

export type FriendshipStatus = (typeof FRIENDSHIP_STATUSES)[number];

/** Représentation minimale de « l'autre » utilisateur dans une relation d'amitié. */
export interface FriendUserSummary {
  pseudo: string;
  avatarUrl: string | null;
}

/** Ligne d'amitié vue du côté de l'utilisateur courant (US-7.1). */
export interface FriendshipSummary {
  id: string;
  status: FriendshipStatus;
  createdAt: string;
  user: FriendUserSummary;
}

/** Agrégat consommé par la page /amis : évite trois aller-retours réseau. */
export interface FriendshipOverview {
  friends: FriendshipSummary[];
  receivedRequests: FriendshipSummary[];
  sentRequests: FriendshipSummary[];
}

/** Statut de la relation entre l'utilisateur connecté et un profil visité. */
export const VIEWER_FRIENDSHIP_STATUSES = [
  'SELF',
  'NONE',
  'PENDING_SENT',
  'PENDING_RECEIVED',
  'FRIENDS',
] as const;

export type ViewerFriendshipStatus = (typeof VIEWER_FRIENDSHIP_STATUSES)[number];

/** Réponse de `GET /friendships/status/:pseudo` : `friendshipId` est `null` sauf si une relation existe. */
export interface FriendshipStatusWithUser {
  status: ViewerFriendshipStatus;
  friendshipId: string | null;
}
