/**
 * Mise à jour partielle du profil (US-4.1) : seuls les champs présents sont
 * modifiés. Contraintes (longueurs, caractères autorisés) validées côté API
 * dans `UpdateProfileDto`.
 */
export interface UpdateProfileRequest {
  pseudo?: string;
  bio?: string;
  avatarUrl?: string;
  favoriteArtist?: string;
}
