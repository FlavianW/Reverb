import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/theme_controller.dart';

/// Bascule de thème (soleil/lune), miroir de `ThemeToggle.svelte` — placée
/// dans l'AppBar de chaque écran principal plutôt que dans un menu, pour
/// rester immédiatement visible.
class ThemeToggleButton extends StatelessWidget {
  const ThemeToggleButton({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return IconButton(
      icon: Icon(isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined),
      tooltip: isDark ? 'Passer au thème clair' : 'Passer au thème sombre',
      onPressed: () => context.read<ThemeController>().toggle(),
    );
  }
}
