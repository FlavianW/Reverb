import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../models/friendship.dart';
import 'avatar.dart';

enum FriendCardKind { friend, received, sent }

/// Miroir de `apps/web/src/lib/components/friend/FriendCard.svelte`.
class FriendCard extends StatefulWidget {
  final FriendshipSummary friendship;
  final FriendCardKind kind;
  final Future<void> Function()? onAccept;
  final Future<void> Function() onRemove;

  const FriendCard({
    super.key,
    required this.friendship,
    required this.kind,
    this.onAccept,
    required this.onRemove,
  });

  @override
  State<FriendCard> createState() => _FriendCardState();
}

class _FriendCardState extends State<FriendCard> {
  bool pending = false;

  Future<void> _handle(Future<void> Function() action) async {
    setState(() => pending = true);
    try {
      await action();
    } finally {
      if (mounted) setState(() => pending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.friendship.user;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        border: Border.all(color: ReverbColors.line),
        borderRadius: BorderRadius.circular(ReverbRadius.md),
        color: ReverbColors.paperAlt,
      ),
      child: Row(
        children: [
          ReverbAvatar(src: user.avatarUrl, name: user.pseudo, size: 44),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              user.pseudo,
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontSize: 17),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (pending)
            const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          else
            ..._actions(),
        ],
      ),
    );
  }

  List<Widget> _actions() {
    switch (widget.kind) {
      case FriendCardKind.friend:
        return [
          TextButton(
            onPressed: () => _handle(widget.onRemove),
            child: const Text('Retirer'),
          ),
        ];
      case FriendCardKind.received:
        return [
          ElevatedButton(
            onPressed: () => _handle(widget.onAccept!),
            child: const Text('Accepter'),
          ),
          const SizedBox(width: 8),
          TextButton(
            onPressed: () => _handle(widget.onRemove),
            child: const Text('Refuser'),
          ),
        ];
      case FriendCardKind.sent:
        return [
          const Text(
            'Demande envoyée',
            style: TextStyle(color: ReverbColors.inkSoft, fontSize: 13),
          ),
          const SizedBox(width: 8),
          TextButton(
            onPressed: () => _handle(widget.onRemove),
            child: const Text('Annuler'),
          ),
        ];
    }
  }
}
