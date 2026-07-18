import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/api_client.dart';
import 'package:mobile/models/concert.dart';
import 'package:mobile/widgets/star_rating.dart';

import '../support/fake_api_client.dart';

void main() {
  testWidgets('taper sur une étoile envoie la note et déclenche onRated', (
    tester,
  ) async {
    String? ratedConcertId;
    int? ratedValue;
    var onRatedCalled = false;
    final api = FakeApiClient()
      ..onRateConcert = (id, value) async {
        ratedConcertId = id;
        ratedValue = value;
      };

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: StarRating(
            api: api,
            concertId: 'c1',
            summary: const ConcertRatingSummary(average: null, count: 0),
            onRated: () => onRatedCalled = true,
          ),
        ),
      ),
    );

    await tester.tap(find.byTooltip('4 étoiles'));
    await tester.pumpAndSettle();

    expect(ratedConcertId, 'c1');
    expect(ratedValue, 4);
    expect(onRatedCalled, isTrue);
    expect(find.text('Merci, votre note a été enregistrée.'), findsOneWidget);
  });

  testWidgets('une erreur API affiche le message au lieu du succès', (
    tester,
  ) async {
    final api = FakeApiClient()
      ..onRateConcert = (id, value) async =>
          throw const ApiException(500, 'Erreur serveur');

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: StarRating(
            api: api,
            concertId: 'c1',
            summary: const ConcertRatingSummary(average: null, count: 0),
            onRated: () {},
          ),
        ),
      ),
    );

    await tester.tap(find.byTooltip('3 étoiles'));
    await tester.pumpAndSettle();

    expect(find.text('Erreur serveur'), findsOneWidget);
    expect(find.text('Merci, votre note a été enregistrée.'), findsNothing);
  });
}
