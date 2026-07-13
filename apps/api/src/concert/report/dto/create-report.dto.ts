import { ReportReason } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class CreateReportDto {
  @IsEnum(ReportReason)
  reason!: ReportReason;
}
