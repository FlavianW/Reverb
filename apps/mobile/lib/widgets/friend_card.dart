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
        border: Border.all(color: context.colors.line),
        borderRadius: BorderRadius.circular(ReverbRadius.md),
        color: context.colors.paperAlt,
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
          TextButton.icon(
            onPressed: () => _handle(widget.onRemove),
            icon: const Icon(Icons.person_remove_outlined, size: 16),
            label: const Text('Retirer'),
          ),
        ];
      case FriendCardKind.received:
        return [
          ElevatedButton.icon(
            onPressed: () => _handle(widget.onAccept!),
            icon: const Icon(Icons.check, size: 16),
            label: const Text('Accepter'),
          ),
          const SizedBox(width: 8),
          TextButton.icon(
            onPressed: () => _handle(widget.onRemove),
            icon: const Icon(Icons.close, size: 16),
            label: const Text('Refuser'),
          ),
        ];
      case FriendCardKind.sent:
        return [
          Text(
            'Demande envoyée',
            style: TextStyle(color: context.colors.inkSoft, fontSize: 13),
          ),
          const SizedBox(width: 8),
          TextButton.icon(
            onPressed: () => _handle(widget.onRemove),
            icon: const Icon(Icons.close, size: 16),
            label: const Text('Annuler'),
          ),
        ];
    }
  }
}
