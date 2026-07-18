import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/theme.dart';
import '../models/friendship.dart';

/// Miroir de `apps/web/src/lib/components/profile/FriendButton.svelte`.
class FriendButton extends StatefulWidget {
  final ApiClient api;
  final String pseudo;
  final ViewerFriendshipStatus initialStatus;
  final String? initialFriendshipId;

  const FriendButton({
    super.key,
    required this.api,
    required this.pseudo,
    required this.initialStatus,
    required this.initialFriendshipId,
  });

  @override
  State<FriendButton> createState() => _FriendButtonState();
}

class _FriendButtonState extends State<FriendButton> {
  late ViewerFriendshipStatus status = widget.initialStatus;
  late String? friendshipId = widget.initialFriendshipId;
  bool pending = false;
  String? error;

  Future<void> _sendRequest() async {
    setState(() {
      pending = true;
      error = null;
    });
    try {
      final friendship = await widget.api.sendFriendRequest(widget.pseudo);
      if (!mounted) return;
      setState(() {
        friendshipId = friendship.id;
        status = friendship.status == FriendshipStatus.accepted
            ? ViewerFriendshipStatus.friends
            : ViewerFriendshipStatus.pendingSent;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => error = e.message);
    } finally {
      if (mounted) setState(() => pending = false);
    }
  }

  Future<void> _accept() async {
    final id = friendshipId;
    if (id == null) return;
    setState(() => pending = true);
    try {
      await widget.api.acceptFriendRequest(id);
      if (!mounted) return;
      setState(() => status = ViewerFriendshipStatus.friends);
    } finally {
      if (mounted) setState(() => pending = false);
    }
  }

  Future<void> _remove() async {
    final id = friendshipId;
    if (id == null) return;
    setState(() => pending = true);
    try {
      await widget.api.removeFriendship(id);
      if (!mounted) return;
      setState(() {
        status = ViewerFriendshipStatus.none;
        friendshipId = null;
      });
    } finally {
      if (mounted) setState(() => pending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (status == ViewerFriendshipStatus.self) {
      return const SizedBox.shrink();
    }

    final Widget button = switch (status) {
      ViewerFriendshipStatus.none => OutlinedButton(
        onPressed: pending ? null : _sendRequest,
        child: const Text('Ajouter en ami'),
      ),
      ViewerFriendshipStatus.pendingSent => TextButton(
        onPressed: pending ? null : _remove,
        child: const Text('Demande envoyée'),
      ),
      ViewerFriendshipStatus.pendingReceived => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          OutlinedButton(
            onPressed: pending ? null : _accept,
            child: const Text('Accepter'),
          ),
          const SizedBox(width: 8),
          TextButton(
            onPressed: pending ? null : _remove,
            child: const Text('Refuser'),
          ),
        ],
      ),
      ViewerFriendshipStatus.friends => TextButton(
        onPressed: pending ? null : _remove,
        child: const Text('Ami·e · Retirer'),
      ),
      ViewerFriendshipStatus.self => const SizedBox.shrink(),
    };

    if (error == null) return button;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        button,
        Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(
            error!,
            style: const TextStyle(
              color: ReverbColors.accentDeep,
              fontSize: 13,
            ),
          ),
        ),
      ],
    );
  }
}
