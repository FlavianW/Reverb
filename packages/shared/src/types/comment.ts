/** Commentaire tel qu'affiché dans la page concert (US-2.4). */
export interface CommentSummary {
  id: string;
  content: string;
  pseudo: string;
  createdAt: string;
}

/**
 * Forme brute renvoyée par `POST /concerts/:id/comments` — distincte de
 * `CommentSummary` : pas de `pseudo`, mais un `userId`.
 */
export interface Comment {
  id: string;
  content: string;
  userId: string;
  concertId: string;
  createdAt: string;
}
