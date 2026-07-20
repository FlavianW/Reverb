import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/theme.dart';
import '../models/friendship.dart';
import '../screens/conversation_screen.dart';

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

  Future<void> _message() async {
    setState(() {
      pending = true;
      error = null;
    });
    try {
      final conversation = await widget.api.startConversation(widget.pseudo);
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => ConversationScreen(
            conversationId: conversation.id,
            otherUser: conversation.otherUser,
          ),
        ),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => error = e.message);
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
      ViewerFriendshipStatus.none => OutlinedButton.icon(
        onPressed: pending ? null : _sendRequest,
        icon: const Icon(Icons.person_add_alt_outlined, size: 18),
        label: const Text('Ajouter en ami'),
      ),
      ViewerFriendshipStatus.pendingSent => TextButton.icon(
        onPressed: pending ? null : _remove,
        icon: const Icon(Icons.close, size: 16),
        label: const Text('Demande envoyée'),
      ),
      ViewerFriendshipStatus.pendingReceived => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          OutlinedButton.icon(
            onPressed: pending ? null : _accept,
            icon: const Icon(Icons.check, size: 18),
            label: const Text('Accepter'),
          ),
          const SizedBox(width: 8),
          TextButton.icon(
            onPressed: pending ? null : _remove,
            icon: const Icon(Icons.close, size: 18),
            label: const Text('Refuser'),
          ),
        ],
      ),
      ViewerFriendshipStatus.friends => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          OutlinedButton.icon(
            onPressed: pending ? null : _message,
            icon: const Icon(Icons.chat_bubble_outline, size: 18),
            label: const Text('Envoyer un message'),
          ),
          const SizedBox(width: 8),
          TextButton.icon(
            onPressed: pending ? null : _remove,
            icon: const Icon(Icons.person_remove_outlined, size: 18),
            label: const Text('Ami·e'),
          ),
        ],
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
            style: TextStyle(
              color: context.colors.accentDeep,
              fontSize: 13,
            ),
          ),
        ),
      ],
    );
  }
}
