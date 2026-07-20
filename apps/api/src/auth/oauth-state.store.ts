import { randomBytes } from 'crypto';
import type { Request } from 'express';

export const OAUTH_STATE_COOKIE_NAME = 'reverb_oauth_state';

/** Le temps d'un aller-retour vers l'écran de consentement Google, pas plus. */
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

type StoreCallback = (err: Error | null, handle: string) => void;
type VerifyCallback = (
  err: Error | null,
  ok: boolean,
  info?: { message: string },
) => void;

/**
 * Store d'état pour `passport-oauth2`, sans session Express (l'app n'a que
 * des sessions JWT stateless, pas de `req.session`) : le nonce anti-CSRF est
 * porté par un cookie httpOnly de courte durée le temps de l'aller-retour
 * vers Google, plutôt que par la session (implémentation par défaut du
 * `store` intégré à la librairie, indisponible ici).
 *
 * Sans ce store, `passport-oauth2` retombe sur son `NullStore` interne, qui
 * accepte n'importe quelle valeur de `state` — ouvrant une CSRF de connexion
 * classique : un attaquant démarre son propre flux OAuth, capture son `code`
 * d'autorisation sans le rejouer, puis le fait rejouer par une victime, qui
 * se retrouve connectée sur le compte de l'attaquant.
 *
 * Deux signatures par méthode (au lieu d'une) pour satisfaire le type
 * `StateStore` de `passport-oauth2` (surchargé avec/sans `meta`) ; en
 * pratique seule la forme à trois/quatre arguments est utilisée par la
 * librairie, détectée via l'arité de la fonction.
 */
export class OAuthStateStore {
  store(req: Request, callback: StoreCallback): void;
  store(req: Request, meta: unknown, callback: StoreCallback): void;
  store(
    req: Request,
    metaOrCallback: unknown,
    maybeCallback?: StoreCallback,
  ): void {
    const callback = (maybeCallback ?? metaOrCallback) as StoreCallback;
    const handle = randomBytes(16).toString('hex');
    req.res?.cookie(OAUTH_STATE_COOKIE_NAME, handle, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: OAUTH_STATE_TTL_MS,
    });
    callback(null, handle);
  }

  verify(req: Request, providedState: string, callback: VerifyCallback): void;
  verify(
    req: Request,
    providedState: string,
    meta: unknown,
    callback: VerifyCallback,
  ): void;
  verify(
    req: Request,
    providedState: string,
    metaOrCallback: unknown,
    maybeCallback?: VerifyCallback,
  ): void {
    const callback = (maybeCallback ?? metaOrCallback) as VerifyCallback;
    const cookieValue = (req.cookies as Record<string, string> | undefined)?.[
      OAUTH_STATE_COOKIE_NAME
    ];
    req.res?.clearCookie(OAUTH_STATE_COOKIE_NAME);

    if (!cookieValue || cookieValue !== providedState) {
      callback(null, false, { message: 'État OAuth invalide ou expiré.' });
      return;
    }
    callback(null, true);
  }
}
