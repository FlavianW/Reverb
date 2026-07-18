import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/friendship.dart';

void main() {
  group('FriendshipSummary.fromJson', () {
    test('parse le statut et l\'utilisateur imbriqué', () {
      final friendship = FriendshipSummary.fromJson({
        'id': 'f1',
        'status': 'ACCEPTED',
        'createdAt': '2026-01-01T10:00:00.000Z',
        'user': {'pseudo': 'alice', 'avatarUrl': null},
      });

      expect(friendship.status, FriendshipStatus.accepted);
      expect(friendship.user.pseudo, 'alice');
    });
  });

  group('FriendshipOverview.fromJson', () {
    test('répartit amis, demandes reçues et envoyées', () {
      final overview = FriendshipOverview.fromJson({
        'friends': [
          {
            'id': 'f1',
            'status': 'ACCEPTED',
            'createdAt': '2026-01-01T10:00:00.000Z',
            'user': {'pseudo': 'alice', 'avatarUrl': null},
          },
        ],
        'receivedRequests': <Object?>[],
        'sentRequests': <Object?>[],
      });

      expect(overview.friends, hasLength(1));
      expect(overview.receivedRequests, isEmpty);
      expect(overview.sentRequests, isEmpty);
    });
  });

  group('FriendshipStatusWithUser.fromJson', () {
    test('parse chaque statut vu par le visiteur', () {
      for (final entry in {
        'SELF': ViewerFriendshipStatus.self,
        'NONE': ViewerFriendshipStatus.none,
        'PENDING_SENT': ViewerFriendshipStatus.pendingSent,
        'PENDING_RECEIVED': ViewerFriendshipStatus.pendingReceived,
        'FRIENDS': ViewerFriendshipStatus.friends,
      }.entries) {
        final status = FriendshipStatusWithUser.fromJson({
          'status': entry.key,
          'friendshipId': null,
        });
        expect(status.status, entry.value);
      }
    });
  });
}
