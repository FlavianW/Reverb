import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/concert.dart';

void main() {
  group('Concert.fromJson', () {
    test('parse les champs et les dates ISO', () {
      final concert = Concert.fromJson({
        'id': 'c1',
        'artistName': 'Radiohead',
        'venueName': 'Zénith',
        'city': 'Paris',
        'date': '2024-05-10T20:00:00.000Z',
        'createdById': 'u1',
        'createdAt': '2024-05-01T10:00:00.000Z',
        'updatedAt': '2024-05-02T10:00:00.000Z',
      });

      expect(concert.artistName, 'Radiohead');
      expect(concert.date, DateTime.parse('2024-05-10T20:00:00.000Z'));
    });
  });

  group('ConcertRatingSummary.fromJson', () {
    test('average null quand aucune note', () {
      final summary = ConcertRatingSummary.fromJson({
        'average': null,
        'count': 0,
      });

      expect(summary.average, isNull);
      expect(summary.count, 0);
    });

    test('average converti en double même si envoyé en entier', () {
      final summary = ConcertRatingSummary.fromJson({'average': 4, 'count': 2});

      expect(summary.average, 4.0);
    });
  });

  group('SetlistFmResult.fromJson', () {
    test('parse la liste de titres', () {
      final setlist = SetlistFmResult.fromJson({
        'songs': ['Creep', 'Karma Police'],
      });

      expect(setlist.songs, ['Creep', 'Karma Police']);
    });
  });

  group('ConcertPage.fromJson', () {
    Map<String, dynamic> baseJson({Object? setlist}) => {
      'id': 'c1',
      'artistName': 'Radiohead',
      'venueName': 'Zénith',
      'city': 'Paris',
      'date': '2024-05-10T20:00:00.000Z',
      'createdById': 'u1',
      'createdAt': '2024-05-01T10:00:00.000Z',
      'updatedAt': '2024-05-02T10:00:00.000Z',
      'setlist': setlist,
      'rating': {'average': null, 'count': 0},
      'comments': <Object?>[],
      'photos': <Object?>[],
    };

    test('setlist null = setlist indisponible', () {
      final page = ConcertPage.fromJson(baseJson(setlist: null));

      expect(page.setlist, isNull);
      expect(page.concert.artistName, 'Radiohead');
    });

    test('parse setlist, commentaires et photos imbriqués', () {
      final json = baseJson(setlist: {'songs': ['Creep']})
        ..['comments'] = [
          {
            'id': 'com1',
            'content': 'Super concert',
            'pseudo': 'alice',
            'createdAt': '2024-05-11T10:00:00.000Z',
          },
        ]
        ..['photos'] = [
          {
            'id': 'ph1',
            'url': 'https://cdn.example.com/ph1.jpg',
            'pseudo': 'bob',
            'createdAt': '2024-05-11T11:00:00.000Z',
          },
        ];

      final page = ConcertPage.fromJson(json);

      expect(page.setlist!.songs, ['Creep']);
      expect(page.comments, hasLength(1));
      expect(page.comments.first.pseudo, 'alice');
      expect(page.photos, hasLength(1));
      expect(page.photos.first.url, 'https://cdn.example.com/ph1.jpg');
    });
  });

  group('Comment.fromJson', () {
    test('forme brute avec userId (pas de pseudo)', () {
      final comment = Comment.fromJson({
        'id': 'com1',
        'content': 'Super concert',
        'userId': 'u1',
        'concertId': 'c1',
        'createdAt': '2024-05-11T10:00:00.000Z',
      });

      expect(comment.userId, 'u1');
      expect(comment.concertId, 'c1');
    });
  });
}
