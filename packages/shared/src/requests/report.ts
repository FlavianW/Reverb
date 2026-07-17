import type { ReportReason } from '../types/report';

export interface CreateReportRequest {
  reason: ReportReason;
}
