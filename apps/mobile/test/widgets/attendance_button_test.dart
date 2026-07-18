import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/widgets/attendance_button.dart';

import '../support/fake_api_client.dart';

void main() {
  testWidgets("marque la présence quand l'utilisateur n'y était pas", (
    tester,
  ) async {
    String? markedConcertId;
    final api = FakeApiClient()
      ..onMarkAttendance = (id) async => markedConcertId = id;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: AttendanceButton(
            api: api,
            concertId: 'c1',
            initialAttending: false,
          ),
        ),
      ),
    );

    await tester.tap(find.text("J'y étais"));
    await tester.pumpAndSettle();

    expect(markedConcertId, 'c1');
  });

  testWidgets('retire la présence quand elle était déjà marquée', (
    tester,
  ) async {
    String? unmarkedConcertId;
    final api = FakeApiClient()
      ..onUnmarkAttendance = (id) async => unmarkedConcertId = id;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: AttendanceButton(
            api: api,
            concertId: 'c1',
            initialAttending: true,
          ),
        ),
      ),
    );

    await tester.tap(find.text("J'y étais"));
    await tester.pumpAndSettle();

    expect(unmarkedConcertId, 'c1');
  });
}
