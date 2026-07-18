import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/report_reason.dart';

void main() {
  test('chaque motif expose la valeur attendue par l\'API', () {
    expect(ReportReason.spam.wireValue, 'SPAM');
    expect(ReportReason.inappropriate.wireValue, 'INAPPROPRIATE');
    expect(ReportReason.harassment.wireValue, 'HARASSMENT');
    expect(ReportReason.other.wireValue, 'OTHER');
  });
}
