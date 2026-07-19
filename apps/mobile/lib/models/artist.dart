/// Suggestion d'artiste pour l'autocomplete (US-4.1).
/// Miroir de `ArtistSuggestion` dans `packages/shared/src/types/artist.ts`.
class ArtistSuggestion {
  final String name;
  final String? imageUrl;

  const ArtistSuggestion({required this.name, required this.imageUrl});

  factory ArtistSuggestion.fromJson(Map<String, dynamic> json) =>
      ArtistSuggestion(
        name: json['name'] as String,
        imageUrl: json['imageUrl'] as String?,
      );
}
