import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/theme.dart';
import 'package:provider/provider.dart';

import 'package:mobile/core/api_client.dart';
import 'package:mobile/core/session.dart';
import 'package:mobile/screens/connexion_screen.dart';

void main() {
  testWidgets('ConnexionScreen affiche le formulaire de connexion par défaut', (
    WidgetTester tester,
  ) async {
    final api = ApiClient();

    await tester.pumpWidget(
      ChangeNotifierProvider<SessionController>(
        create: (_) => SessionController(api),
        child: MaterialApp(theme: buildReverbLightTheme(), home: ConnexionScreen()),
      ),
    );

    expect(find.text('Bon retour parmi nous'), findsOneWidget);
    expect(find.text('Se connecter'), findsOneWidget);

    await tester.tap(find.text('Créer un compte'));
    await tester.pump();

    expect(find.text('Rejoindre Reverb'), findsOneWidget);
    expect(find.text('Créer mon compte'), findsOneWidget);
  });

  testWidgets('ConnexionScreen ouvre sur l\'inscription au tout premier lancement', (
    WidgetTester tester,
  ) async {
    final api = ApiClient();

    await tester.pumpWidget(
      ChangeNotifierProvider<SessionController>(
        create: (_) => SessionController(api),
        child: MaterialApp(
          theme: buildReverbLightTheme(),
          home: const ConnexionScreen(initialSignup: true),
        ),
      ),
    );

    expect(find.text('Rejoindre Reverb'), findsOneWidget);
    expect(find.text('Bon retour parmi nous'), findsNothing);
  });
}
