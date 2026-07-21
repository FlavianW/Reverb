/**
 * Inscription par email/mot de passe (US-1.1). Les contraintes (mot de passe
 * 8–72 caractères, pseudo alphanumérique ≤ 50) sont validées côté API dans
 * `RegisterDto`.
 */
export interface RegisterRequest {
  email: string;
  password: string;
  pseudo: string;
}

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

/**
 * Politique de mot de passe (US-1.1), source unique de vérité entre l'API
 * (`RegisterDto`, qui applique ces mêmes règles via `class-validator`) et le
 * web (qui les affiche comme prérequis en direct pendant la saisie). L'app
 * mobile (Dart, hors package partagé) mirrore ces règles manuellement.
 */
export const PASSWORD_REQUIREMENTS: {
  label: string;
  test: (password: string) => boolean;
}[] = [
  {
    label: `Au moins ${PASSWORD_MIN_LENGTH} caractères`,
    test: (password) => password.length >= PASSWORD_MIN_LENGTH,
  },
  { label: 'Une majuscule', test: (password) => /[A-Z]/.test(password) },
  { label: 'Une minuscule', test: (password) => /[a-z]/.test(password) },
  { label: 'Un chiffre', test: (password) => /[0-9]/.test(password) },
  {
    label: 'Un caractère spécial',
    test: (password) => /[^a-zA-Z0-9]/.test(password),
  },
];

/** Connexion par email/mot de passe (US-1.2). */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Connexion OAuth Google côté mobile (US-1.1) : l'app native obtient l'ID
 * token directement auprès de Google (`google_sign_in`), sans passer par la
 * redirection navigateur utilisée côté web (`GET /auth/google`).
 */
export interface GoogleMobileLoginRequest {
  idToken: string;
}
