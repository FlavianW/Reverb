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

/** Contrat de `GET /concerts/nearby` (US-9.1) — transmis en query params. */
export interface NearbyConcertsRequest {
  lat: number;
  lng: number;
  /** Rayon de recherche en kilomètres, défaut 50. */
  radiusKm?: number;
}
