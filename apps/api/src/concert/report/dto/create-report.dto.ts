import { ReportReason } from '@prisma/client';
import type { CreateReportRequest } from '@reverb/shared';
import { IsEnum } from 'class-validator';

export class CreateReportDto implements CreateReportRequest {
  @IsEnum(ReportReason)
  reason!: ReportReason;
}
