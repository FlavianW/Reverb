/**
 * Union de littéraux indépendante de Prisma (ce package est aussi consommé
 * par le navigateur). Reflète `enum VideoStatus` dans `apps/api/prisma/schema.prisma`.
 */
export const VIDEO_STATUSES = ['PROCESSING', 'READY', 'FAILED'] as const;

export type VideoStatus = (typeof VIDEO_STATUSES)[number];

/** Vidéo telle qu'affichée dans un post (US-8.2). */
export interface VideoSummary {
  id: string;
  status: VideoStatus;
  /** URL de lecture, `null` tant que le transcodage n'est pas terminé (`status !== 'READY'`). */
  url: string | null;
  posterUrl: string | null;
  durationSeconds: number | null;
}

/** Vidéo de la galerie d'un concert (US-5.1), avec le pseudo de son auteur. */
export interface ConcertVideoSummary extends VideoSummary {
  pseudo: string;
  createdAt: string;
}
