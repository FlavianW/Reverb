/// Représentation d'un utilisateur exposable au client (sans googleId ni dates internes).
/// Miroir de `PublicUser` dans `packages/shared/src/types/user.ts`.
class PublicUser {
  final String id;
  final String pseudo;
  final String email;
  final String? avatarUrl;
  final String? bannerUrl;
  final String? bio;
  final String? favoriteArtist;

  const PublicUser({
    required this.id,
    required this.pseudo,
    required this.email,
    required this.avatarUrl,
    required this.bannerUrl,
    required this.bio,
    required this.favoriteArtist,
  });

  factory PublicUser.fromJson(Map<String, dynamic> json) => PublicUser(
    id: json['id'] as String,
    pseudo: json['pseudo'] as String,
    email: json['email'] as String,
    avatarUrl: json['avatarUrl'] as String?,
    bannerUrl: json['bannerUrl'] as String?,
    bio: json['bio'] as String?,
    favoriteArtist: json['favoriteArtist'] as String?,
  );
}
