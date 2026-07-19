/** Notation d'un concert (US-2.3). Un nouvel envoi remplace la note précédente. */
export interface RateConcertRequest {
  /** Note entière de 1 à 5, validée côté API dans `RateConcertDto`. */
  value: number;
}
