import type { ReportReason } from '../types/report';

/** Signalement d'un commentaire ou d'une photo (US-6.1) — la cible est portée par l'URL. */
export interface CreateReportRequest {
  reason: ReportReason;
}
