import 'concert.dart';

/// Profil consultable par n'importe quel visiteur (US-4.1, US-4.2).
/// Miroir de `PublicProfile` dans `packages/shared/src/types/user.ts`.
class PublicProfile {
  final String pseudo;
  final String? bio;
  final String? avatarUrl;
  final List<Concert> attendedConcerts;

  const PublicProfile({
    required this.pseudo,
    required this.bio,
    required this.avatarUrl,
    required this.attendedConcerts,
  });

  factory PublicProfile.fromJson(Map<String, dynamic> json) => PublicProfile(
    pseudo: json['pseudo'] as String,
    bio: json['bio'] as String?,
    avatarUrl: json['avatarUrl'] as String?,
    attendedConcerts: (json['attendedConcerts'] as List<dynamic>)
        .map((e) => Concert.fromJson(e as Map<String, dynamic>))
        .toList(),
  );
}
