export interface RegisterRequest {
  email: string;
  password: string;
  pseudo: string;
}

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
