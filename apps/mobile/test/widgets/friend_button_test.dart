import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/theme.dart';
import 'package:mobile/models/friendship.dart';
import 'package:mobile/widgets/friend_button.dart';

import '../support/fake_api_client.dart';

void main() {
  testWidgets(
    'NONE : envoyer une demande passe le bouton sur "Demande envoyée"',
    (tester) async {
      final api = FakeApiClient()
        ..onSendFriendRequest = (pseudo) async => FriendshipSummary(
          id: 'f1',
          status: FriendshipStatus.pending,
          createdAt: DateTime(2026, 1, 1),
          user: FriendUserSummary(pseudo: pseudo, avatarUrl: null),
        );

      await tester.pumpWidget(
        MaterialApp(
        theme: buildReverbLightTheme(),
          home: Scaffold(
            body: FriendButton(
              api: api,
              pseudo: 'bob',
              initialStatus: ViewerFriendshipStatus.none,
              initialFriendshipId: null,
            ),
          ),
        ),
      );

      await tester.tap(find.text('Ajouter en ami'));
      await tester.pumpAndSettle();

      expect(find.text('Demande envoyée'), findsOneWidget);
    },
  );

  testWidgets('PENDING_RECEIVED : accepter passe le bouton sur "Ami·e"', (
    tester,
  ) async {
    final api = FakeApiClient()..onAcceptFriendRequest = (id) async {};

    await tester.pumpWidget(
      MaterialApp(
        theme: buildReverbLightTheme(),
        home: Scaffold(
          body: FriendButton(
            api: api,
            pseudo: 'bob',
            initialStatus: ViewerFriendshipStatus.pendingReceived,
            initialFriendshipId: 'f1',
          ),
        ),
      ),
    );

    await tester.tap(find.text('Accepter'));
    await tester.pumpAndSettle();

    expect(find.textContaining('Ami'), findsOneWidget);
  });

  testWidgets('SELF ne rend rien', (tester) async {
    final api = FakeApiClient();

    await tester.pumpWidget(
      MaterialApp(
        theme: buildReverbLightTheme(),
        home: Scaffold(
          body: FriendButton(
            api: api,
            pseudo: 'moi',
            initialStatus: ViewerFriendshipStatus.self,
            initialFriendshipId: null,
          ),
        ),
      ),
    );

    expect(find.byType(FriendButton), findsOneWidget);
    expect(find.text('Ajouter en ami'), findsNothing);
  });
}
