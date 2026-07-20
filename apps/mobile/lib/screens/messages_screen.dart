import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/theme.dart';
import '../models/chat.dart';
import '../widgets/avatar.dart';
import '../widgets/theme_toggle_button.dart';
import 'conversation_screen.dart';

/// Liste des conversations (US-10.1), miroir de
/// `apps/web/src/routes/messages/+page.svelte` + `ConversationList.svelte`.
/// [onConversationRead] prévient `RootShell` qu'il faut rafraîchir le
/// compteur non lus de l'onglet, après un aller-retour sur un fil.
class MessagesScreen extends StatefulWidget {
  final VoidCallback? onConversationRead;

  const MessagesScreen({super.key, this.onConversationRead});

  @override
  State<MessagesScreen> createState() => MessagesScreenState();
}

class MessagesScreenState extends State<MessagesScreen> {
  late Future<List<ConversationSummary>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<ConversationSummary>> _load() =>
      context.read<ApiClient>().getConversations();

  /// Exposé pour que `RootShell` recharge la liste quand on rouvre l'onglet.
  void reload() {
    setState(() {
      _future = _load();
    });
  }

  Future<void> _openConversation(ConversationSummary conversation) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ConversationScreen(
          conversationId: conversation.id,
          otherUser: conversation.otherUser,
        ),
      ),
    );
    reload();
    widget.onConversationRead?.call();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
        actions: const [ThemeToggleButton()],
      ),
      body: FutureBuilder<List<ConversationSummary>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            final message = snapshot.error is ApiException
                ? (snapshot.error as ApiException).message
                : 'Une erreur est survenue.';
            return Center(child: Text(message));
          }
          final conversations = snapshot.data ?? [];
          if (conversations.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  'Aucune conversation. Écrivez à un ami depuis son profil.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: context.colors.inkSoft),
                ),
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: conversations.length,
            separatorBuilder: (_, _) => const SizedBox(height: 2),
            itemBuilder: (context, index) =>
                _ConversationRow(
                  conversation: conversations[index],
                  onTap: () => _openConversation(conversations[index]),
                ),
          );
        },
      ),
    );
  }
}

class _ConversationRow extends StatelessWidget {
  final ConversationSummary conversation;
  final VoidCallback onTap;

  const _ConversationRow({required this.conversation, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final unread = conversation.unreadCount > 0;

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(
          children: [
            ReverbAvatar(
              src: conversation.otherUser.avatarUrl,
              name: conversation.otherUser.pseudo,
              size: 44,
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    conversation.otherUser.pseudo,
                    style: TextStyle(
                      fontFamily: 'serif',
                      fontSize: 15,
                      fontWeight: unread ? FontWeight.w700 : FontWeight.w500,
                      color: context.colors.ink,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (conversation.lastMessage != null)
                    Text(
                      conversation.lastMessage!.content,
                      style: TextStyle(color: context.colors.inkSoft, fontSize: 13),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  DateFormat('d MMM', 'fr_FR').format(conversation.updatedAt.toLocal()),
                  style: TextStyle(color: context.colors.inkSoft, fontSize: 11),
                ),
                if (unread) ...[
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                    decoration: BoxDecoration(
                      color: context.colors.accent,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      '${conversation.unreadCount}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
