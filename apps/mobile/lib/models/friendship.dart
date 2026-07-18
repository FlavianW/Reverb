/// Miroir de `FriendshipStatus` dans `packages/shared/src/types/friendship.ts`.
enum FriendshipStatus {
  pending('PENDING'),
  accepted('ACCEPTED');

  final String wireValue;
  const FriendshipStatus(this.wireValue);

  static FriendshipStatus fromWire(String value) =>
      values.firstWhere((status) => status.wireValue == value);
}

/// Représentation minimale de « l'autre » utilisateur dans une relation d'amitié.
class FriendUserSummary {
  final String pseudo;
  final String? avatarUrl;

  const FriendUserSummary({required this.pseudo, required this.avatarUrl});

  factory FriendUserSummary.fromJson(Map<String, dynamic> json) =>
      FriendUserSummary(
        pseudo: json['pseudo'] as String,
        avatarUrl: json['avatarUrl'] as String?,
      );
}

/// Ligne d'amitié vue du côté de l'utilisateur courant (US-7.1).
class FriendshipSummary {
  final String id;
  final FriendshipStatus status;
  final DateTime createdAt;
  final FriendUserSummary user;

  const FriendshipSummary({
    required this.id,
    required this.status,
    required this.createdAt,
    required this.user,
  });

  factory FriendshipSummary.fromJson(Map<String, dynamic> json) =>
      FriendshipSummary(
        id: json['id'] as String,
        status: FriendshipStatus.fromWire(json['status'] as String),
        createdAt: DateTime.parse(json['createdAt'] as String),
        user: FriendUserSummary.fromJson(json['user'] as Map<String, dynamic>),
      );
}

/// Agrégat consommé par l'écran Amis : évite trois aller-retours réseau.
class FriendshipOverview {
  final List<FriendshipSummary> friends;
  final List<FriendshipSummary> receivedRequests;
  final List<FriendshipSummary> sentRequests;

  const FriendshipOverview({
    required this.friends,
    required this.receivedRequests,
    required this.sentRequests,
  });

  factory FriendshipOverview.fromJson(Map<String, dynamic> json) =>
      FriendshipOverview(
        friends: (json['friends'] as List<dynamic>)
            .map((e) => FriendshipSummary.fromJson(e as Map<String, dynamic>))
            .toList(),
        receivedRequests: (json['receivedRequests'] as List<dynamic>)
            .map((e) => FriendshipSummary.fromJson(e as Map<String, dynamic>))
            .toList(),
        sentRequests: (json['sentRequests'] as List<dynamic>)
            .map((e) => FriendshipSummary.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

/// Statut de la relation entre l'utilisateur connecté et un profil visité.
enum ViewerFriendshipStatus {
  self('SELF'),
  none('NONE'),
  pendingSent('PENDING_SENT'),
  pendingReceived('PENDING_RECEIVED'),
  friends('FRIENDS');

  final String wireValue;
  const ViewerFriendshipStatus(this.wireValue);

  static ViewerFriendshipStatus fromWire(String value) =>
      values.firstWhere((status) => status.wireValue == value);
}

class FriendshipStatusWithUser {
  final ViewerFriendshipStatus status;
  final String? friendshipId;

  const FriendshipStatusWithUser({required this.status, required this.friendshipId});

  factory FriendshipStatusWithUser.fromJson(Map<String, dynamic> json) =>
      FriendshipStatusWithUser(
        status: ViewerFriendshipStatus.fromWire(json['status'] as String),
        friendshipId: json['friendshipId'] as String?,
      );
}
