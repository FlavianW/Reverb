import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _prefsKey = 'reverb_theme_mode';

/// Préférence de thème persistée (US thème sombre), miroir de `$lib/theme.ts`
/// côté web : `ThemeMode.system` par défaut (suit l'OS), une bascule
/// explicite prime dans les deux sens et survit aux relances de l'app.
class ThemeController extends ChangeNotifier {
  ThemeMode _mode = ThemeMode.system;
  ThemeMode get mode => _mode;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getString(_prefsKey);
    if (stored == 'light') {
      _mode = ThemeMode.light;
    } else if (stored == 'dark') {
      _mode = ThemeMode.dark;
    }
    notifyListeners();
  }

  Future<void> toggle() async {
    final isDark = _mode == ThemeMode.dark || (_mode == ThemeMode.system && _systemIsDark());
    _mode = isDark ? ThemeMode.light : ThemeMode.dark;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefsKey, _mode == ThemeMode.dark ? 'dark' : 'light');
  }

  bool _systemIsDark() =>
      PlatformDispatcher.instance.platformBrightness == Brightness.dark;
}
