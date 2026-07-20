/// Miroir de `packages/shared/src/types/chat.ts`.
class ChatUserSummary {
  final String pseudo;
  final String? avatarUrl;

  const ChatUserSummary({required this.pseudo, required this.avatarUrl});

  factory ChatUserSummary.fromJson(Map<String, dynamic> json) =>
      ChatUserSummary(
        pseudo: json['pseudo'] as String,
        avatarUrl: json['avatarUrl'] as String?,
      );
}

/// Message d'une conversation (US-10.1, US-10.2).
class MessageSummary {
  final String id;
  final String conversationId;
  final String senderId;
  final String content;
  final DateTime createdAt;

  const MessageSummary({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.content,
    required this.createdAt,
  });

  factory MessageSummary.fromJson(Map<String, dynamic> json) =>
      MessageSummary(
        id: json['id'] as String,
        conversationId: json['conversationId'] as String,
        senderId: json['senderId'] as String,
        content: json['content'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}

/// Page de messages, du plus ancien au plus récent (US-10.2) : `nextCursor`
/// pointe vers des messages plus anciens, `null` s'il n'y en a plus.
class MessagePage {
  final List<MessageSummary> items;
  final String? nextCursor;

  const MessagePage({required this.items, required this.nextCursor});

  factory MessagePage.fromJson(Map<String, dynamic> json) => MessagePage(
    items: (json['items'] as List<dynamic>)
        .map((e) => MessageSummary.fromJson(e as Map<String, dynamic>))
        .toList(),
    nextCursor: json['nextCursor'] as String?,
  );
}

/// Ligne de la liste des conversations (US-10.1) : `lastMessage` est `null`
/// pour une conversation tout juste créée, sans message échangé.
class ConversationSummary {
  final String id;
  final ChatUserSummary otherUser;
  final MessageSummary? lastMessage;
  final int unreadCount;
  final DateTime updatedAt;

  const ConversationSummary({
    required this.id,
    required this.otherUser,
    required this.lastMessage,
    required this.unreadCount,
    required this.updatedAt,
  });

  factory ConversationSummary.fromJson(Map<String, dynamic> json) =>
      ConversationSummary(
        id: json['id'] as String,
        otherUser: ChatUserSummary.fromJson(
          json['otherUser'] as Map<String, dynamic>,
        ),
        lastMessage: json['lastMessage'] == null
            ? null
            : MessageSummary.fromJson(
                json['lastMessage'] as Map<String, dynamic>,
              ),
        unreadCount: json['unreadCount'] as int,
        updatedAt: DateTime.parse(json['updatedAt'] as String),
      );
}
