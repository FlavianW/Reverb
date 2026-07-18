/**
 * Union de littéraux indépendante de Prisma (ce package est aussi consommé
 * par le navigateur). Reflète `enum PostType` dans `apps/api/prisma/schema.prisma`.
 */
export const POST_TYPES = ['RATING', 'ATTENDANCE', 'PHOTO'] as const;

export type PostType = (typeof POST_TYPES)[number];

/** Post tel qu'affiché dans le fil d'actualité ou sur un profil (US-8.x). */
export interface PostSummary {
  id: string;
  type: PostType;
  author: { pseudo: string; avatarUrl: string | null };
  concert: { id: string; artistName: string; venueName: string; city: string } | null;
  content: string | null;
  ratingValue: number | null;
  photos: { id: string; url: string }[];
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
}

/** Page paginée par curseur (première pagination du projet). */
export interface PostPage {
  items: PostSummary[];
  nextCursor: string | null;
}
