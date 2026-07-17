/**
 * Union de littéraux indépendante de Prisma (ce package est aussi consommé
 * par le navigateur). Reflète `enum ReportReason` dans `apps/api/prisma/schema.prisma`.
 */
export const REPORT_REASONS = [
  'SPAM',
  'INAPPROPRIATE',
  'HARASSMENT',
  'OTHER',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

/** Signalement d'un commentaire ou d'une photo (US-6.1). */
export interface Report {
  id: string;
  reason: ReportReason;
  reporterId: string;
  commentId: string | null;
  photoId: string | null;
  createdAt: string;
}
