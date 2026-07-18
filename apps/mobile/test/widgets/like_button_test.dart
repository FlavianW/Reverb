import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/theme.dart';
import 'package:mobile/widgets/like_button.dart';

import '../support/fake_api_client.dart';

void main() {
  testWidgets('like puis unlike met à jour le compteur affiché', (
    tester,
  ) async {
    final api = FakeApiClient()
      ..onLikePost = (id) async {}
      ..onUnlikePost = (id) async {};

    await tester.pumpWidget(
      MaterialApp(
        theme: buildReverbLightTheme(),
        home: Scaffold(
          body: LikeButton(
            api: api,
            postId: 'post-1',
            initialLikeCount: 2,
            initialLikedByMe: false,
          ),
        ),
      ),
    );

    expect(find.text('2'), findsOneWidget);

    await tester.tap(find.byType(TextButton));
    await tester.pumpAndSettle();

    expect(find.text('3'), findsOneWidget);

    await tester.tap(find.byType(TextButton));
    await tester.pumpAndSettle();

    expect(find.text('2'), findsOneWidget);
  });
}
