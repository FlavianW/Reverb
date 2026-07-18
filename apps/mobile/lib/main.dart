import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';

import 'core/api_client.dart';
import 'core/session.dart';
import 'core/theme.dart';
import 'screens/connexion_screen.dart';
import 'screens/root_shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('fr_FR');
  runApp(const ReverbApp());
}

class ReverbApp extends StatelessWidget {
  const ReverbApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<ApiClient>(create: (_) => ApiClient()),
        ChangeNotifierProvider<SessionController>(
          create: (context) => SessionController(context.read<ApiClient>())..refresh(),
        ),
      ],
      child: MaterialApp(
        title: 'Reverb',
        debugShowCheckedModeBanner: false,
        theme: buildReverbTheme(),
        home: const _AuthGate(),
      ),
    );
  }
}

/// Garde de session : équivalent mobile de `hooks.server.ts` côté web —
/// redirige vers la connexion tant que `SessionController` n'a pas confirmé
/// un utilisateur authentifié.
class _AuthGate extends StatelessWidget {
  const _AuthGate();

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionController>();

    switch (session.status) {
      case SessionStatus.unknown:
        return const Scaffold(body: Center(child: CircularProgressIndicator()));
      case SessionStatus.authenticated:
        return const RootShell();
      case SessionStatus.anonymous:
        return const ConnexionScreen();
    }
  }
}
