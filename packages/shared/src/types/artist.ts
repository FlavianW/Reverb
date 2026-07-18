/** Suggestion d'artiste pour l'autocomplete (US-4.1), avec sa photo si Last.fm en a une. */
export interface ArtistSuggestion {
  name: string;
  imageUrl: string | null;
}
