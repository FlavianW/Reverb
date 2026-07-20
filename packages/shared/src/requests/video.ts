/** Demande d'URL présignée pour un upload vidéo direct navigateur/app → S3. */
export interface PresignVideoUploadRequest {
  contentType: string;
}

/**
 * Champs à soumettre tels quels dans le `FormData` d'un POST multipart
 * directement vers `uploadUrl` (S3 presigned POST : `fields` doit précéder
 * le fichier dans le corps du formulaire).
 */
export interface PresignVideoUploadResponse {
  uploadUrl: string;
  fields: Record<string, string>;
  key: string;
}

/**
 * Cas du post (US-8.2) : l'id du post est généré au moment du presign (avant
 * que le post existe) pour que la clé S3 puisse le référencer — voir
 * `PostService.presignVideoUpload`.
 */
export interface PresignPostVideoUploadResponse extends PresignVideoUploadResponse {
  postId: string;
}

/** Confirmation qu'une vidéo a bien été déposée sur S3 à la clé `key` (galerie concert). */
export interface ConfirmConcertVideoRequest {
  key: string;
}

/** Crée un post explicite dont le média est une vidéo déjà uploadée (mutuellement exclusif des photos). */
export interface CreateVideoPostRequest {
  postId: string;
  key: string;
  content?: string;
  concertId?: string;
}
