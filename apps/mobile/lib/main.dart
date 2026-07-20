import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';

import 'core/api_client.dart';
import 'core/first_launch.dart';
import 'core/session.dart';
import 'core/theme.dart';
import 'core/theme_controller.dart';
import 'screens/connexion_screen.dart';
import 'screens/root_shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('fr_FR');
  final isFirstLaunch = await consumeFirstLaunch();
  runApp(ReverbApp(isFirstLaunch: isFirstLaunch));
}

class ReverbApp extends StatelessWidget {
  final bool isFirstLaunch;

  const ReverbApp({super.key, required this.isFirstLaunch});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<ApiClient>(create: (_) => ApiClient()),
        ChangeNotifierProvider<SessionController>(
          create: (context) => SessionController(context.read<ApiClient>())..refresh(),
        ),
        ChangeNotifierProvider<ThemeController>(
          create: (_) => ThemeController()..load(),
        ),
      ],
      child: Consumer<ThemeController>(
        builder: (context, themeController, _) => MaterialApp(
          title: 'Reverb',
          debugShowCheckedModeBanner: false,
          theme: buildReverbLightTheme(),
          darkTheme: buildReverbDarkTheme(),
          themeMode: themeController.mode,
          home: _AuthGate(isFirstLaunch: isFirstLaunch),
        ),
      ),
    );
  }
}

/// Garde de session : équivalent mobile de `hooks.server.ts` côté web —
/// redirige vers la connexion tant que `SessionController` n'a pas confirmé
/// un utilisateur authentifié.
class _AuthGate extends StatelessWidget {
  final bool isFirstLaunch;

  const _AuthGate({required this.isFirstLaunch});

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionController>();

    switch (session.status) {
      case SessionStatus.unknown:
        return const Scaffold(body: Center(child: CircularProgressIndicator()));
      case SessionStatus.authenticated:
        return const RootShell();
      case SessionStatus.anonymous:
        return ConnexionScreen(initialSignup: isFirstLaunch);
      case SessionStatus.error:
        return const Scaffold(
          body: Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Text(
                'Erreur réseau, veuillez redémarrer l\'application.',
                textAlign: TextAlign.center,
              ),
            ),
          ),
        );
    }
  }
}
