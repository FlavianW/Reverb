import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/api_client.dart';
import 'package:mobile/models/report_reason.dart';
import 'package:mobile/widgets/report_button.dart';

void main() {
  testWidgets('un signalement réussi passe le bouton sur "Signalé"', (
    tester,
  ) async {
    ReportReason? reportedReason;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ReportButton(
            onReport: (reason) async => reportedReason = reason,
          ),
        ),
      ),
    );

    await tester.tap(find.text('Signaler'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Confirmer'));
    await tester.pumpAndSettle();

    expect(reportedReason, ReportReason.spam);
    expect(find.text('Signalé'), findsOneWidget);
  });

  testWidgets('un 409 (déjà signalé) est traité comme un succès silencieux', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ReportButton(
            onReport: (reason) async =>
                throw const ApiException(409, 'Déjà signalé'),
          ),
        ),
      ),
    );

    await tester.tap(find.text('Signaler'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Confirmer'));
    await tester.pumpAndSettle();

    expect(find.text('Signalé'), findsOneWidget);
    expect(find.byType(SnackBar), findsNothing);
  });
}
