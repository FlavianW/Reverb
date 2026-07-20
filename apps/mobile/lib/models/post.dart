/// Miroir de `PostType` dans `packages/shared/src/types/post.ts`.
enum PostType {
  rating('RATING'),
  attendance('ATTENDANCE'),
  photo('PHOTO');

  final String wireValue;
  const PostType(this.wireValue);

  static PostType fromWire(String value) =>
      values.firstWhere((type) => type.wireValue == value);
}

class PostAuthor {
  final String pseudo;
  final String? avatarUrl;

  const PostAuthor({required this.pseudo, required this.avatarUrl});

  factory PostAuthor.fromJson(Map<String, dynamic> json) => PostAuthor(
    pseudo: json['pseudo'] as String,
    avatarUrl: json['avatarUrl'] as String?,
  );
}

/// Référence allégée du concert associé à un post (pas la fiche complète).
class PostConcertRef {
  final String id;
  final String artistName;
  final String venueName;
  final String city;

  const PostConcertRef({
    required this.id,
    required this.artistName,
    required this.venueName,
    required this.city,
  });

  factory PostConcertRef.fromJson(Map<String, dynamic> json) => PostConcertRef(
    id: json['id'] as String,
    artistName: json['artistName'] as String,
    venueName: json['venueName'] as String,
    city: json['city'] as String,
  );
}

class PostPhotoRef {
  final String id;
  final String url;

  const PostPhotoRef({required this.id, required this.url});

  factory PostPhotoRef.fromJson(Map<String, dynamic> json) =>
      PostPhotoRef(id: json['id'] as String, url: json['url'] as String);
}

/// Miroir de `VideoStatus` dans `packages/shared/src/types/video.ts`.
enum VideoStatus {
  processing('PROCESSING'),
  ready('READY'),
  failed('FAILED');

  final String wireValue;
  const VideoStatus(this.wireValue);

  static VideoStatus fromWire(String value) =>
      values.firstWhere((status) => status.wireValue == value);
}

/// Vidéo attachée à un post (US-8.2), miroir de `VideoSummary`. `url` est
/// `null` tant que le transcodage n'est pas terminé (`status != ready`).
class PostVideoRef {
  final String id;
  final VideoStatus status;
  final String? url;
  final String? posterUrl;
  final int? durationSeconds;

  const PostVideoRef({
    required this.id,
    required this.status,
    required this.url,
    required this.posterUrl,
    required this.durationSeconds,
  });

  factory PostVideoRef.fromJson(Map<String, dynamic> json) => PostVideoRef(
    id: json['id'] as String,
    status: VideoStatus.fromWire(json['status'] as String),
    url: json['url'] as String?,
    posterUrl: json['posterUrl'] as String?,
    durationSeconds: json['durationSeconds'] as int?,
  );
}

/// Champs à soumettre tels quels dans le `FormData` d'un POST multipart
/// directement vers `uploadUrl` (S3 presigned POST), avec l'id du post déjà
/// décidé côté API pour que la clé S3 puisse le référencer avant sa création.
class PresignedVideoUpload {
  final String uploadUrl;
  final Map<String, String> fields;
  final String key;
  final String postId;

  const PresignedVideoUpload({
    required this.uploadUrl,
    required this.fields,
    required this.key,
    required this.postId,
  });

  factory PresignedVideoUpload.fromJson(Map<String, dynamic> json) =>
      PresignedVideoUpload(
        uploadUrl: json['uploadUrl'] as String,
        fields: (json['fields'] as Map<String, dynamic>).map(
          (key, value) => MapEntry(key, value as String),
        ),
        key: json['key'] as String,
        postId: json['postId'] as String,
      );
}

/// Post tel qu'affiché dans le fil d'actualité ou sur un profil (US-8.x).
class PostSummary {
  final String id;
  final PostType type;
  final PostAuthor author;
  final PostConcertRef? concert;
  final String? content;
  final int? ratingValue;
  final List<PostPhotoRef> photos;
  /// `null` si le post n'a pas de vidéo (mutuellement exclusif de `photos`).
  final PostVideoRef? video;
  final int likeCount;
  final bool likedByMe;
  final DateTime createdAt;

  const PostSummary({
    required this.id,
    required this.type,
    required this.author,
    required this.concert,
    required this.content,
    required this.ratingValue,
    required this.photos,
    required this.video,
    required this.likeCount,
    required this.likedByMe,
    required this.createdAt,
  });

  factory PostSummary.fromJson(Map<String, dynamic> json) => PostSummary(
    id: json['id'] as String,
    type: PostType.fromWire(json['type'] as String),
    author: PostAuthor.fromJson(json['author'] as Map<String, dynamic>),
    concert: json['concert'] == null
        ? null
        : PostConcertRef.fromJson(json['concert'] as Map<String, dynamic>),
    content: json['content'] as String?,
    ratingValue: json['ratingValue'] as int?,
    photos: (json['photos'] as List<dynamic>)
        .map((e) => PostPhotoRef.fromJson(e as Map<String, dynamic>))
        .toList(),
    video: json['video'] == null
        ? null
        : PostVideoRef.fromJson(json['video'] as Map<String, dynamic>),
    likeCount: json['likeCount'] as int,
    likedByMe: json['likedByMe'] as bool,
    createdAt: DateTime.parse(json['createdAt'] as String),
  );
}

/// Page paginée par curseur (fil d'actualité ou posts d'un profil).
class PostPage {
  final List<PostSummary> items;
  final String? nextCursor;

  const PostPage({required this.items, required this.nextCursor});

  factory PostPage.fromJson(Map<String, dynamic> json) => PostPage(
    items: (json['items'] as List<dynamic>)
        .map((e) => PostSummary.fromJson(e as Map<String, dynamic>))
        .toList(),
    nextCursor: json['nextCursor'] as String?,
  );
}
