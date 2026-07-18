import 'package:flutter/material.dart';

import '../core/theme.dart';

/// Miroir de `apps/web/src/lib/components/ui/Avatar.svelte` : image si
/// `src` est fourni, sinon initiales du pseudo sur fond accent-soft.
class ReverbAvatar extends StatelessWidget {
  final String? src;
  final String name;
  final double size;

  const ReverbAvatar({
    super.key,
    required this.src,
    required this.name,
    this.size = 40,
  });

  String get _initials {
    final trimmed = name.trim();
    if (trimmed.isEmpty) return '?';
    return trimmed.substring(0, 1).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    if (src != null && src!.isNotEmpty) {
      return CircleAvatar(
        radius: size / 2,
        backgroundColor: context.colors.accentSoft,
        backgroundImage: NetworkImage(src!),
      );
    }
    return CircleAvatar(
      radius: size / 2,
      backgroundColor: context.colors.accentSoft,
      child: Text(
        _initials,
        style: TextStyle(
          color: context.colors.accentDeep,
          fontWeight: FontWeight.w700,
          fontSize: size * 0.4,
        ),
      ),
    );
  }
}
