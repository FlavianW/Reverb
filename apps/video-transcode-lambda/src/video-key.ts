/**
 * Un original est déposé sous `.../original.<ext>` (concert ou post, même
 * convention) ; le Lambda écrit ses rendus en `playback.mp4`/`poster.jpg`
 * dans le même dossier. Le filtre de suffixe est aussi configuré côté
 * notification S3 — ce contrôle est une défense en profondeur pour ne
 * jamais retraiter un rendu déjà produit (boucle infinie sinon, puisque les
 * rendus sont écrits dans le même préfixe que l'original).
 */
const ORIGINAL_KEY_PATTERN = /\/original\.(mp4|mov)$/i;

export function isOriginalVideoKey(key: string): boolean {
  return ORIGINAL_KEY_PATTERN.test(key);
}

export interface DerivedOutputKeys {
  playbackKey: string;
  posterKey: string;
}

export function deriveOutputKeys(originalKey: string): DerivedOutputKeys {
  const dir = originalKey.slice(0, originalKey.lastIndexOf('/'));
  return {
    playbackKey: `${dir}/playback.mp4`,
    posterKey: `${dir}/poster.jpg`,
  };
}
