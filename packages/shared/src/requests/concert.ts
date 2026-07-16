export interface CreateConcertRequest {
  artistName: string;
  venueName: string;
  city: string;
  /** Date ISO 8601 (ex: "2024-06-15" ou "2024-06-15T20:00:00Z"). */
  date: string;
}

/** Sans `q` (absent ou vide), sert de fil d'accueil : les concerts les plus récents. */
export interface SearchConcertsRequest {
  q?: string;
}
