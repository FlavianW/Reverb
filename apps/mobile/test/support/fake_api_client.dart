import 'package:mobile/core/api_client.dart';
import 'package:mobile/models/friendship.dart';
import 'package:mobile/models/public_user.dart';

/// Double de test pour [ApiClient] : évite tout appel réseau réel (dio,
/// path_provider) en court-circuitant chaque méthode par un callback
/// configurable, appelé au lieu du comportement HTTP d'origine.
class FakeApiClient extends ApiClient {
  Future<PublicUser?> Function()? onMe;
  Future<PublicUser> Function(String email, String password)? onLogin;
  Future<PublicUser> Function(String email, String password, String pseudo)?
  onRegister;
  Future<void> Function()? onLogout;
  Future<void> Function(String concertId, int value)? onRateConcert;
  Future<void> Function(String concertId)? onMarkAttendance;
  Future<void> Function(String concertId)? onUnmarkAttendance;
  Future<void> Function(String postId)? onLikePost;
  Future<void> Function(String postId)? onUnlikePost;
  Future<FriendshipSummary> Function(String pseudo)? onSendFriendRequest;
  Future<void> Function(String id)? onAcceptFriendRequest;
  Future<void> Function(String id)? onRemoveFriendship;

  @override
  Future<PublicUser?> me() => onMe!();

  @override
  Future<PublicUser> login({required String email, required String password}) =>
      onLogin!(email, password);

  @override
  Future<PublicUser> register({
    required String email,
    required String password,
    required String pseudo,
  }) => onRegister!(email, password, pseudo);

  @override
  Future<void> logout() => onLogout!();

  @override
  Future<void> rateConcert(String id, int value) => onRateConcert!(id, value);

  @override
  Future<void> markAttendance(String id) => onMarkAttendance!(id);

  @override
  Future<void> unmarkAttendance(String id) => onUnmarkAttendance!(id);

  @override
  Future<void> likePost(String id) => onLikePost!(id);

  @override
  Future<void> unlikePost(String id) => onUnlikePost!(id);

  @override
  Future<FriendshipSummary> sendFriendRequest(String pseudo) =>
      onSendFriendRequest!(pseudo);

  @override
  Future<void> acceptFriendRequest(String id) => onAcceptFriendRequest!(id);

  @override
  Future<void> removeFriendship(String id) => onRemoveFriendship!(id);
}
