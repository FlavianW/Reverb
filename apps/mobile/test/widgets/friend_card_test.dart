import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/theme.dart';
import 'package:mobile/models/friendship.dart';
import 'package:mobile/widgets/friend_card.dart';

void main() {
  final friendship = FriendshipSummary(
    id: 'f1',
    status: FriendshipStatus.accepted,
    createdAt: DateTime(2026, 1, 1),
    user: const FriendUserSummary(pseudo: 'alice', avatarUrl: null),
  );

  testWidgets('kind friend affiche "Retirer" et déclenche onRemove', (
    tester,
  ) async {
    var removed = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: buildReverbLightTheme(),
        home: Scaffold(
          body: FriendCard(
            friendship: friendship,
            kind: FriendCardKind.friend,
            onRemove: () async => removed = true,
          ),
        ),
      ),
    );

    expect(find.text('alice'), findsOneWidget);
    await tester.tap(find.text('Retirer'));
    await tester.pumpAndSettle();

    expect(removed, isTrue);
  });

  testWidgets('kind received affiche Accepter et Refuser', (tester) async {
    var accepted = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: buildReverbLightTheme(),
        home: Scaffold(
          body: FriendCard(
            friendship: friendship,
            kind: FriendCardKind.received,
            onAccept: () async => accepted = true,
            onRemove: () async {},
          ),
        ),
      ),
    );

    expect(find.text('Accepter'), findsOneWidget);
    expect(find.text('Refuser'), findsOneWidget);

    await tester.tap(find.text('Accepter'));
    await tester.pumpAndSettle();

    expect(accepted, isTrue);
  });

  testWidgets('kind sent affiche "Demande envoyée" et un bouton Annuler', (
    tester,
  ) async {
    var cancelled = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: buildReverbLightTheme(),
        home: Scaffold(
          body: FriendCard(
            friendship: friendship,
            kind: FriendCardKind.sent,
            onRemove: () async => cancelled = true,
          ),
        ),
      ),
    );

    expect(find.text('Demande envoyée'), findsOneWidget);
    await tester.tap(find.text('Annuler'));
    await tester.pumpAndSettle();

    expect(cancelled, isTrue);
  });
}
