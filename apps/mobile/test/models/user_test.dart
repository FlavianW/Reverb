import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/public_profile.dart';
import 'package:mobile/models/public_user.dart';

void main() {
  group('PublicUser.fromJson', () {
    test('champs optionnels absents deviennent null', () {
      final user = PublicUser.fromJson({
        'id': 'u1',
        'pseudo': 'alice',
        'email': 'alice@example.com',
        'avatarUrl': null,
        'bio': null,
      });

      expect(user.avatarUrl, isNull);
      expect(user.bio, isNull);
    });
  });

  group('PublicProfile.fromJson', () {
    test('parse la liste des concerts assistés', () {
      final profile = PublicProfile.fromJson({
        'pseudo': 'alice',
        'bio': 'Fan de rock',
        'avatarUrl': 'https://cdn.example.com/a.jpg',
        'attendedConcerts': [
          {
            'id': 'c1',
            'artistName': 'Radiohead',
            'venueName': 'Zénith',
            'city': 'Paris',
            'date': '2024-05-10T20:00:00.000Z',
            'createdById': 'u1',
            'createdAt': '2024-05-01T10:00:00.000Z',
            'updatedAt': '2024-05-02T10:00:00.000Z',
          },
        ],
      });

      expect(profile.attendedConcerts, hasLength(1));
      expect(profile.attendedConcerts.first.artistName, 'Radiohead');
    });
  });
}
