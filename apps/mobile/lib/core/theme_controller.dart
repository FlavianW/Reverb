import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _prefsKey = 'reverb_theme_mode';

/// Préférence de thème persistée, miroir de `$lib/theme.ts` côté web : le
/// sombre est le thème par défaut de Reverb (identité « salle de concert »),
/// le clair est un choix explicite qui survit aux relances de l'app.
class ThemeController extends ChangeNotifier {
  ThemeMode _mode = ThemeMode.dark;
  ThemeMode get mode => _mode;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    if (prefs.getString(_prefsKey) == 'light') {
      _mode = ThemeMode.light;
    }
    notifyListeners();
  }

  Future<void> toggle() async {
    _mode = _mode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefsKey, _mode == ThemeMode.dark ? 'dark' : 'light');
  }
}
