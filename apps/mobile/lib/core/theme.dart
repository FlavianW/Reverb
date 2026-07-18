import 'package:flutter/material.dart';

/// Palette et rayons repris de `apps/web/src/lib/styles/tokens.css` — même
/// identité visuelle que le front SvelteKit, seule source de vérité du design.
class ReverbColors {
  static const paper = Color(0xFFF7F4EE);
  static const paperAlt = Color(0xFFFFFFFF);
  static const ink = Color(0xFF1C1A17);
  static const inkSoft = Color(0xFF6B6259);
  static const line = Color(0xFFE4DDD0);
  static const accent = Color(0xFFC1502B);
  static const accentSoft = Color(0xFFF3DDCB);
  static const accentDeep = Color(0xFF8F3A1D);
}

class ReverbRadius {
  static const sm = 8.0;
  static const md = 10.0;
  static const lg = 14.0;
}

/// Newsreader/Manrope (web) n'étant pas embarquées dans l'app, on retombe sur
/// les familles génériques 'serif'/'sans-serif' du système — l'identité de
/// couleur et de forme reste fidèle, la police est une approximation.
ThemeData buildReverbTheme() {
  final colorScheme = ColorScheme.fromSeed(
    seedColor: ReverbColors.accent,
    brightness: Brightness.light,
    primary: ReverbColors.accent,
    surface: ReverbColors.paper,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: ReverbColors.paper,
    fontFamily: 'sans-serif',
    appBarTheme: const AppBarTheme(
      backgroundColor: ReverbColors.paper,
      foregroundColor: ReverbColors.ink,
      elevation: 0,
      centerTitle: false,
    ),
    textTheme: const TextTheme(
      headlineMedium: TextStyle(
        fontFamily: 'serif',
        fontStyle: FontStyle.italic,
        fontWeight: FontWeight.w500,
        color: ReverbColors.ink,
      ),
      titleLarge: TextStyle(
        fontFamily: 'serif',
        fontWeight: FontWeight.w500,
        color: ReverbColors.ink,
      ),
      bodyLarge: TextStyle(color: ReverbColors.ink),
      bodyMedium: TextStyle(color: ReverbColors.ink),
      bodySmall: TextStyle(color: ReverbColors.inkSoft),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: ReverbColors.paperAlt,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(ReverbRadius.sm),
        borderSide: const BorderSide(color: ReverbColors.line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(ReverbRadius.sm),
        borderSide: const BorderSide(color: ReverbColors.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(ReverbRadius.sm),
        borderSide: const BorderSide(color: ReverbColors.accent, width: 2),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: ReverbColors.accent,
        foregroundColor: const Color(0xFFFBF6EE),
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(ReverbRadius.sm),
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: ReverbColors.ink,
        side: const BorderSide(color: ReverbColors.line),
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(ReverbRadius.sm),
        ),
      ),
    ),
    cardTheme: CardThemeData(
      color: ReverbColors.paperAlt,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(ReverbRadius.md),
        side: const BorderSide(color: ReverbColors.line),
      ),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: ReverbColors.paperAlt,
      selectedItemColor: ReverbColors.accent,
      unselectedItemColor: ReverbColors.inkSoft,
    ),
  );
}
