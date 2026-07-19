import 'package:flutter/material.dart';

/// Palette repise de `apps/web/src/lib/styles/tokens.css` — même identité
/// visuelle que le front SvelteKit, seule source de vérité du design.
/// `ThemeExtension` plutôt que des constantes statiques : c'est ce qui
/// permet aux ~70 usages de `context.colors.X` dans l'app de basculer
/// automatiquement entre les palettes claire/sombre (US thème sombre).
@immutable
class ReverbColors extends ThemeExtension<ReverbColors> {
  final Color paper;
  final Color paperAlt;
  final Color ink;
  final Color inkSoft;
  final Color line;
  final Color accent;
  final Color accentSoft;
  final Color accentDeep;

  const ReverbColors({
    required this.paper,
    required this.paperAlt,
    required this.ink,
    required this.inkSoft,
    required this.line,
    required this.accent,
    required this.accentSoft,
    required this.accentDeep,
  });

  static const light = ReverbColors(
    paper: Color(0xFFF7F4EE),
    paperAlt: Color(0xFFFFFFFF),
    ink: Color(0xFF1C1A17),
    inkSoft: Color(0xFF6B6259),
    line: Color(0xFFE4DDD0),
    accent: Color(0xFFC1502B),
    accentSoft: Color(0xFFF3DDCB),
    accentDeep: Color(0xFF8F3A1D),
  );

  /// Mêmes valeurs que `apps/web/src/lib/styles/tokens.css` (contrastes
  /// vérifiés AA : ink/paper 15:1, inkSoft/paper 7.6:1, accent/paper 5.7:1).
  static const dark = ReverbColors(
    paper: Color(0xFF1B1815),
    paperAlt: Color(0xFF242019),
    ink: Color(0xFFF2ECE2),
    inkSoft: Color(0xFFB3A99C),
    line: Color(0xFF3A332B),
    accent: Color(0xFFE2734A),
    accentSoft: Color(0xFF3D2517),
    accentDeep: Color(0xFFF0A67D),
  );

  @override
  ReverbColors copyWith({
    Color? paper,
    Color? paperAlt,
    Color? ink,
    Color? inkSoft,
    Color? line,
    Color? accent,
    Color? accentSoft,
    Color? accentDeep,
  }) => ReverbColors(
    paper: paper ?? this.paper,
    paperAlt: paperAlt ?? this.paperAlt,
    ink: ink ?? this.ink,
    inkSoft: inkSoft ?? this.inkSoft,
    line: line ?? this.line,
    accent: accent ?? this.accent,
    accentSoft: accentSoft ?? this.accentSoft,
    accentDeep: accentDeep ?? this.accentDeep,
  );

  @override
  ReverbColors lerp(ThemeExtension<ReverbColors>? other, double t) {
    if (other is! ReverbColors) return this;
    return ReverbColors(
      paper: Color.lerp(paper, other.paper, t)!,
      paperAlt: Color.lerp(paperAlt, other.paperAlt, t)!,
      ink: Color.lerp(ink, other.ink, t)!,
      inkSoft: Color.lerp(inkSoft, other.inkSoft, t)!,
      line: Color.lerp(line, other.line, t)!,
      accent: Color.lerp(accent, other.accent, t)!,
      accentSoft: Color.lerp(accentSoft, other.accentSoft, t)!,
      accentDeep: Color.lerp(accentDeep, other.accentDeep, t)!,
    );
  }
}

/// Accès terse à la palette active : `context.colors.inkSoft` plutôt que
/// `Theme.of(context).extension<ReverbColors>()!.inkSoft`.
extension ReverbColorsContext on BuildContext {
  ReverbColors get colors => Theme.of(this).extension<ReverbColors>()!;
}

class ReverbRadius {
  static const sm = 8.0;
  static const md = 10.0;
  static const lg = 14.0;
}

/// Newsreader/Manrope (web) n'étant pas embarquées dans l'app, on retombe sur
/// les familles génériques 'serif'/'sans-serif' du système — l'identité de
/// couleur et de forme reste fidèle, la police est une approximation.
ThemeData buildReverbTheme(ReverbColors colors, Brightness brightness) {
  final colorScheme = ColorScheme.fromSeed(
    seedColor: colors.accent,
    brightness: brightness,
    primary: colors.accent,
    surface: colors.paper,
  );

  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: colors.paper,
    fontFamily: 'sans-serif',
    extensions: [colors],
    appBarTheme: AppBarTheme(
      backgroundColor: colors.paper,
      foregroundColor: colors.ink,
      elevation: 0,
      centerTitle: false,
    ),
    textTheme: TextTheme(
      headlineMedium: TextStyle(
        fontFamily: 'serif',
        fontStyle: FontStyle.italic,
        fontWeight: FontWeight.w500,
        color: colors.ink,
      ),
      titleLarge: TextStyle(
        fontFamily: 'serif',
        fontWeight: FontWeight.w500,
        color: colors.ink,
      ),
      bodyLarge: TextStyle(color: colors.ink),
      bodyMedium: TextStyle(color: colors.ink),
      bodySmall: TextStyle(color: colors.inkSoft),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: colors.paperAlt,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(ReverbRadius.sm),
        borderSide: BorderSide(color: colors.line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(ReverbRadius.sm),
        borderSide: BorderSide(color: colors.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(ReverbRadius.sm),
        borderSide: BorderSide(color: colors.accent, width: 2),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: colors.accent,
        foregroundColor: const Color(0xFFFBF6EE),
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(ReverbRadius.sm),
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: colors.ink,
        side: BorderSide(color: colors.line),
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(ReverbRadius.sm),
        ),
      ),
    ),
    cardTheme: CardThemeData(
      color: colors.paperAlt,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(ReverbRadius.md),
        side: BorderSide(color: colors.line),
      ),
    ),
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: colors.paperAlt,
      selectedItemColor: colors.accent,
      unselectedItemColor: colors.inkSoft,
    ),
  );
}

ThemeData buildReverbLightTheme() =>
    buildReverbTheme(ReverbColors.light, Brightness.light);

ThemeData buildReverbDarkTheme() =>
    buildReverbTheme(ReverbColors.dark, Brightness.dark);
