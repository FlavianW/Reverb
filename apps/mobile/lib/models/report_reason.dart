/// Reflète `enum ReportReason` dans `apps/api/prisma/schema.prisma`,
/// miroir de `packages/shared/src/types/report.ts`.
enum ReportReason {
  spam('SPAM', 'Spam'),
  inappropriate('INAPPROPRIATE', 'Contenu inapproprié'),
  harassment('HARASSMENT', 'Harcèlement'),
  other('OTHER', 'Autre');

  final String wireValue;
  final String label;

  const ReportReason(this.wireValue, this.label);
}
