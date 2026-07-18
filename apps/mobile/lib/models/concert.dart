/// Miroir de `Concert` dans `packages/shared/src/types/concert.ts`.
class Concert {
  final String id;
  final String artistName;
  final String venueName;
  final String city;
  final DateTime date;
  final String createdById;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Concert({
    required this.id,
    required this.artistName,
    required this.venueName,
    required this.city,
    required this.date,
    required this.createdById,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Concert.fromJson(Map<String, dynamic> json) => Concert(
    id: json['id'] as String,
    artistName: json['artistName'] as String,
    venueName: json['venueName'] as String,
    city: json['city'] as String,
    date: DateTime.parse(json['date'] as String),
    createdById: json['createdById'] as String,
    createdAt: DateTime.parse(json['createdAt'] as String),
    updatedAt: DateTime.parse(json['updatedAt'] as String),
  );
}

/// Setlist récupérée depuis Setlist.fm (US-2.1). `null` = indisponible.
class SetlistFmResult {
  final List<String> songs;

  const SetlistFmResult({required this.songs});

  factory SetlistFmResult.fromJson(Map<String, dynamic> json) =>
      SetlistFmResult(
        songs: (json['songs'] as List<dynamic>).cast<String>(),
      );
}

/// Agrégat de notation d'un concert (US-2.3).
class ConcertRatingSummary {
  final double? average;
  final int count;

  const ConcertRatingSummary({required this.average, required this.count});

  factory ConcertRatingSummary.fromJson(Map<String, dynamic> json) =>
      ConcertRatingSummary(
        average: (json['average'] as num?)?.toDouble(),
        count: json['count'] as int,
      );
}

/// Page concert enrichie (US-2.1) : `setlist == null` = setlist non disponible.
class ConcertPage {
  final Concert concert;
  final SetlistFmResult? setlist;
  final ConcertRatingSummary rating;
  final List<CommentSummary> comments;
  final List<PhotoSummary> photos;

  const ConcertPage({
    required this.concert,
    required this.setlist,
    required this.rating,
    required this.comments,
    required this.photos,
  });

  factory ConcertPage.fromJson(Map<String, dynamic> json) => ConcertPage(
    concert: Concert.fromJson(json),
    setlist: json['setlist'] == null
        ? null
        : SetlistFmResult.fromJson(json['setlist'] as Map<String, dynamic>),
    rating: ConcertRatingSummary.fromJson(
      json['rating'] as Map<String, dynamic>,
    ),
    comments: (json['comments'] as List<dynamic>)
        .map((e) => CommentSummary.fromJson(e as Map<String, dynamic>))
        .toList(),
    photos: (json['photos'] as List<dynamic>)
        .map((e) => PhotoSummary.fromJson(e as Map<String, dynamic>))
        .toList(),
  );
}

/// Commentaire tel qu'affiché dans la page concert (US-2.4).
class CommentSummary {
  final String id;
  final String content;
  final String pseudo;
  final DateTime createdAt;

  const CommentSummary({
    required this.id,
    required this.content,
    required this.pseudo,
    required this.createdAt,
  });

  factory CommentSummary.fromJson(Map<String, dynamic> json) =>
      CommentSummary(
        id: json['id'] as String,
        content: json['content'] as String,
        pseudo: json['pseudo'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}

/// Forme brute renvoyée par `POST /concerts/:id/comments` (pas de `pseudo`, mais un `userId`).
class Comment {
  final String id;
  final String content;
  final String userId;
  final String concertId;
  final DateTime createdAt;

  const Comment({
    required this.id,
    required this.content,
    required this.userId,
    required this.concertId,
    required this.createdAt,
  });

  factory Comment.fromJson(Map<String, dynamic> json) => Comment(
    id: json['id'] as String,
    content: json['content'] as String,
    userId: json['userId'] as String,
    concertId: json['concertId'] as String,
    createdAt: DateTime.parse(json['createdAt'] as String),
  );
}

/// Photo de la galerie d'un concert (US-5.1).
class PhotoSummary {
  final String id;
  final String url;
  final String pseudo;
  final DateTime createdAt;

  const PhotoSummary({
    required this.id,
    required this.url,
    required this.pseudo,
    required this.createdAt,
  });

  factory PhotoSummary.fromJson(Map<String, dynamic> json) => PhotoSummary(
    id: json['id'] as String,
    url: json['url'] as String,
    pseudo: json['pseudo'] as String,
    createdAt: DateTime.parse(json['createdAt'] as String),
  );
}
