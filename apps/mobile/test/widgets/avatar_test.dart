import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/widgets/avatar.dart';

void main() {
  testWidgets("affiche l'initiale du pseudo quand aucune image n'est fournie", (
    tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: ReverbAvatar(src: null, name: 'Alice')),
      ),
    );

    expect(find.text('A'), findsOneWidget);
  });

  testWidgets('un pseudo vide retombe sur "?"', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: Scaffold(body: ReverbAvatar(src: null, name: '  '))),
    );

    expect(find.text('?'), findsOneWidget);
  });
}
