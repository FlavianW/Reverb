import type { ConcertSearchResult } from './concert';

/** Représentation d'un utilisateur exposable au client (sans googleId ni dates internes). */
export interface PublicUser {
  id: string;
  pseudo: string;
  email: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  favoriteArtist: string | null;
}

/**
 * Profil consultable par n'importe quel visiteur (US-4.1, US-4.2) : ni email
 * ni id, contrairement à `PublicUser` qui est réservé au propriétaire du compte.
 */
export interface PublicProfile {
  pseudo: string;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  favoriteArtist: string | null;
  /** Photo de `favoriteArtist` via Last.fm, `null` si non renseigné ou introuvable. */
  favoriteArtistImageUrl: string | null;
  /** Chaque concert embarque la photo de son artiste, comme un résultat de recherche. */
  attendedConcerts: ConcertSearchResult[];
}
