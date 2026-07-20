import type { CommentSummary } from './comment';
import type { PhotoSummary } from './photo';
import type { ConcertRatingSummary } from './rating';
import type { ConcertVideoSummary } from './video';

/**
 * Forme JSON réellement reçue par le client — les champs date sont des
 * chaînes ISO 8601, contrairement aux types Prisma internes à `apps/api`
 * qui manipulent des `Date`. Ces types ne sont pas réimportés côté API :
 * ils documentent le contrat de sérialisation, pas la couche service.
 */
export interface Concert {
  id: string;
  artistName: string;
  venueName: string;
  city: string;
  date: string;
  /** Précision ville, `null` si Setlist.fm ne les fournit pas et que le géocodage a échoué (US-9.1). */
  latitude: number | null;
  longitude: number | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface SetlistFmResult {
  songs: string[];
}

/** Page concert enrichie (US-2.1) : `setlist: null` = setlist non disponible. */
export interface ConcertPage extends Concert {
  setlist: SetlistFmResult | null;
  rating: ConcertRatingSummary;
  comments: CommentSummary[];
  photos: PhotoSummary[];
  videos: ConcertVideoSummary[];
  /** Photo de l'artiste via Last.fm, `null` si introuvable. */
  artistImageUrl: string | null;
}

/** Concert renvoyé par la recherche de proximité (US-9.1), trié par distance croissante. */
export interface NearbyConcert extends Concert {
  distanceKm: number;
}

/**
 * Résultat de la recherche de concerts (US-3.1) : le concert et la photo de
 * son artiste (Last.fm, mise en cache côté API), `null` si indisponible.
 */
export interface ConcertSearchResult extends Concert {
  artistImageUrl: string | null;
}
