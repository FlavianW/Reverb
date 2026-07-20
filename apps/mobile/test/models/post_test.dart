import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/post.dart';

void main() {
  Map<String, dynamic> basePostJson({
    String type = 'PHOTO',
    Object? concert,
    Object? content,
    Object? ratingValue,
    List<Object?> photos = const [],
    Object? video,
  }) => {
    'id': 'post-1',
    'type': type,
    'author': {'pseudo': 'demo', 'avatarUrl': null},
    'concert': concert,
    'content': content,
    'ratingValue': ratingValue,
    'photos': photos,
    'video': video,
    'likeCount': 0,
    'likedByMe': false,
    'createdAt': '2026-01-01T10:00:00.000Z',
  };

  group('PostSummary.fromJson', () {
    test('parse un post RATING avec sa note et son concert', () {
      final post = PostSummary.fromJson(
        basePostJson(
          type: 'RATING',
          ratingValue: 4,
          concert: {
            'id': 'c1',
            'artistName': 'Radiohead',
            'venueName': 'Zénith',
            'city': 'Paris',
          },
        ),
      );

      expect(post.type, PostType.rating);
      expect(post.ratingValue, 4);
      expect(post.concert!.artistName, 'Radiohead');
    });

    test('parse un post PHOTO avec plusieurs photos', () {
      final post = PostSummary.fromJson(
        basePostJson(
          content: 'Super soirée',
          photos: [
            {'id': 'ph1', 'url': 'https://cdn.example.com/ph1.jpg'},
            {'id': 'ph2', 'url': 'https://cdn.example.com/ph2.jpg'},
          ],
        ),
      );

      expect(post.type, PostType.photo);
      expect(post.content, 'Super soirée');
      expect(post.photos, hasLength(2));
      expect(post.concert, isNull);
      expect(post.video, isNull);
    });

    test('parse un post vidéo en cours de traitement (url absente)', () {
      final post = PostSummary.fromJson(
        basePostJson(
          video: {
            'id': 'v1',
            'status': 'PROCESSING',
            'url': null,
            'posterUrl': null,
            'durationSeconds': null,
          },
        ),
      );

      expect(post.video, isNotNull);
      expect(post.video!.status, VideoStatus.processing);
      expect(post.video!.url, isNull);
      expect(post.photos, isEmpty);
    });

    test('parse un post vidéo prête avec ses URLs', () {
      final post = PostSummary.fromJson(
        basePostJson(
          video: {
            'id': 'v1',
            'status': 'READY',
            'url': 'https://cdn.example.com/playback.mp4',
            'posterUrl': 'https://cdn.example.com/poster.jpg',
            'durationSeconds': 42,
          },
        ),
      );

      expect(post.video!.status, VideoStatus.ready);
      expect(post.video!.url, 'https://cdn.example.com/playback.mp4');
      expect(post.video!.durationSeconds, 42);
    });
  });

  group('PostPage.fromJson', () {
    test('parse les items et le curseur suivant', () {
      final page = PostPage.fromJson({
        'items': [basePostJson()],
        'nextCursor': 'post-1',
      });

      expect(page.items, hasLength(1));
      expect(page.nextCursor, 'post-1');
    });

    test('nextCursor null quand il n\'y a pas de page suivante', () {
      final page = PostPage.fromJson({'items': <Object?>[], 'nextCursor': null});

      expect(page.items, isEmpty);
      expect(page.nextCursor, isNull);
    });
  });
}
