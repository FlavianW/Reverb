import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:socket_io_client/socket_io_client.dart' as socket_io;

import '../core/api_client.dart';
import '../core/chat_socket.dart';
import '../core/session.dart';
import '../core/theme.dart';
import '../models/chat.dart';
import '../widgets/avatar.dart';

/// Fil de messages d'une conversation (US-10.2, US-10.3), miroir de
/// `MessageThread.svelte` : chargement initial en REST, envoi/réception en
/// temps réel via Socket.IO (namespace `/chat`, authentifié par le cookie de
/// session). Web n'a pas d'en-tête dans le fil (le pseudo vient de la barre
/// latérale, absente ici) : l'`AppBar` avec avatar + pseudo remplace ce repère.
class ConversationScreen extends StatefulWidget {
  final String conversationId;
  final ChatUserSummary otherUser;

  const ConversationScreen({
    super.key,
    required this.conversationId,
    required this.otherUser,
  });

  @override
  State<ConversationScreen> createState() => _ConversationScreenState();
}

class _ConversationScreenState extends State<ConversationScreen> {
  final _scrollController = ScrollController();
  socket_io.Socket? _socket;
  List<MessageSummary> _items = [];
  String? _cursor;
  bool _loading = true;
  bool _loadingOlder = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final api = context.read<ApiClient>();
    try {
      final page = await api.getMessages(widget.conversationId);
      if (!mounted) return;
      setState(() {
        _items = page.items;
        _cursor = page.nextCursor;
        _loading = false;
      });
      // Ouvrir le fil le marque comme lu, comme `[conversationId]/+page.server.ts`.
      unawaited(api.markConversationRead(widget.conversationId));
      unawaited(_connectSocket(api));
      _scheduleScrollToBottom();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    }
  }

  Future<void> _connectSocket(ApiClient api) async {
    final socket = await createChatSocket(api);
    if (!mounted) {
      socket.dispose();
      return;
    }
    // `ready` confirme que l'authentification du socket (vérification du
    // cookie de session) est terminée côté serveur : émettre avant risquerait
    // que `joinConversation` arrive trop tôt et soit silencieusement ignoré.
    socket.on('ready', (_) {
      socket.emit('joinConversation', {
        'conversationId': widget.conversationId,
      });
    });
    socket.on('message:new', (data) {
      final message = MessageSummary.fromJson(
        Map<String, dynamic>.from(data as Map),
      );
      if (message.conversationId != widget.conversationId) return;
      if (!mounted) return;
      setState(() => _items = [..._items, message]);
      unawaited(api.markConversationRead(widget.conversationId));
      _scheduleScrollToBottom();
    });
    _socket = socket;
  }

  void _scheduleScrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
    });
  }

  Future<void> _loadOlder() async {
    final cursor = _cursor;
    if (cursor == null) return;
    setState(() => _loadingOlder = true);
    try {
      final olderPage = await context.read<ApiClient>().getMessages(
        widget.conversationId,
        cursor,
      );
      if (!mounted) return;
      setState(() {
        _items = [...olderPage.items, ..._items];
        _cursor = olderPage.nextCursor;
      });
    } finally {
      if (mounted) setState(() => _loadingOlder = false);
    }
  }

  void _send(String content) {
    _socket?.emit('sendMessage', {
      'conversationId': widget.conversationId,
      'content': content,
    });
  }

  @override
  void dispose() {
    _socket?.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currentUserId = context.read<SessionController>().user!.id;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            ReverbAvatar(
              src: widget.otherUser.avatarUrl,
              name: widget.otherUser.pseudo,
              size: 32,
            ),
            const SizedBox(width: 10),
            Flexible(
              child: Text(widget.otherUser.pseudo, overflow: TextOverflow.ellipsis),
            ),
          ],
        ),
      ),
      body: SafeArea(child: _body(context, currentUserId)),
    );
  }

  Widget _body(BuildContext context, String currentUserId) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Text(_error!, style: TextStyle(color: context.colors.accentDeep)),
      );
    }
    return Column(
      children: [
        if (_cursor != null)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: OutlinedButton(
              onPressed: _loadingOlder ? null : _loadOlder,
              child: Text(
                _loadingOlder ? 'Chargement…' : 'Charger les messages plus anciens',
              ),
            ),
          ),
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.all(16),
            itemCount: _items.length,
            itemBuilder: (context, index) {
              final message = _items[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _MessageBubble(
                  message: message,
                  isOwn: message.senderId == currentUserId,
                ),
              );
            },
          ),
        ),
        _Composer(onSend: _send),
      ],
    );
  }
}

/// Miroir de `MessageBubble.svelte` : bulle à droite pour ses propres
/// messages, à gauche pour ceux reçus.
class _MessageBubble extends StatelessWidget {
  final MessageSummary message;
  final bool isOwn;

  const _MessageBubble({required this.message, required this.isOwn});

  @override
  Widget build(BuildContext context) {
    final time = DateFormat('HH:mm').format(message.createdAt.toLocal());

    return Row(
      mainAxisAlignment: isOwn ? MainAxisAlignment.end : MainAxisAlignment.start,
      children: [
        ConstrainedBox(
          constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.7),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: isOwn ? context.colors.accentSoft : context.colors.paperAlt,
              borderRadius: BorderRadius.circular(ReverbRadius.md),
              border: isOwn ? null : Border.all(color: context.colors.line),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(message.content, style: TextStyle(color: context.colors.ink)),
                const SizedBox(height: 2),
                Text(
                  time,
                  style: TextStyle(color: context.colors.inkSoft, fontSize: 11),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// Miroir de `Composer.svelte` : Entrée envoie, Maj+Entrée insère une ligne.
class _Composer extends StatefulWidget {
  final ValueChanged<String> onSend;

  const _Composer({required this.onSend});

  @override
  State<_Composer> createState() => _ComposerState();
}

class _ComposerState extends State<_Composer> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();

  void _submit() {
    final trimmed = _controller.text.trim();
    if (trimmed.isEmpty) return;
    widget.onSend(trimmed);
    _controller.clear();
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: TextField(
                controller: _controller,
                focusNode: _focusNode,
                minLines: 1,
                maxLines: 5,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _submit(),
                decoration: const InputDecoration(hintText: 'Écrire un message…'),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filled(onPressed: _submit, icon: const Icon(Icons.send)),
          ],
        ),
      ),
    );
  }
}
