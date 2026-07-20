import type { Request } from 'express';
import { OAUTH_STATE_COOKIE_NAME, OAuthStateStore } from './oauth-state.store';

describe('OAuthStateStore', () => {
  let store: OAuthStateStore;
  let cookie: jest.Mock;
  let clearCookie: jest.Mock;

  const buildRequest = (cookies: Record<string, string> = {}): Request => {
    cookie = jest.fn();
    clearCookie = jest.fn();
    return {
      cookies,
      res: { cookie, clearCookie },
    } as unknown as Request;
  };

  beforeEach(() => {
    store = new OAuthStateStore();
  });

  describe('store', () => {
    it('pose un nonce en cookie httpOnly et le renvoie comme état à transmettre à Google', () => {
      const req = buildRequest();
      const callback = jest.fn();

      store.store(req, callback);

      expect(cookie).toHaveBeenCalledTimes(1);
      const [name, value, options] = cookie.mock.calls[0] as [
        string,
        string,
        Record<string, unknown>,
      ];
      expect(name).toBe(OAUTH_STATE_COOKIE_NAME);
      expect(value).toMatch(/^[0-9a-f]{32}$/);
      expect(options).toMatchObject({ httpOnly: true, sameSite: 'lax' });

      expect(callback).toHaveBeenCalledWith(null, value);
    });

    it('génère un nonce différent à chaque appel (non réutilisable)', () => {
      const first = jest.fn();
      const second = jest.fn();

      store.store(buildRequest(), first);
      store.store(buildRequest(), second);

      const firstHandle = (first.mock.calls[0] as [unknown, string])[1];
      const secondHandle = (second.mock.calls[0] as [unknown, string])[1];
      expect(firstHandle).not.toBe(secondHandle);
    });
  });

  describe('verify', () => {
    it('accepte un état qui correspond au cookie posé au départ', () => {
      const req = buildRequest({ [OAUTH_STATE_COOKIE_NAME]: 'le-bon-nonce' });
      const callback = jest.fn();

      store.verify(req, 'le-bon-nonce', callback);

      expect(callback).toHaveBeenCalledWith(null, true);
      expect(clearCookie).toHaveBeenCalledWith(OAUTH_STATE_COOKIE_NAME);
    });

    it('rejette un état forgé par un attaquant ne correspondant pas au cookie (CSRF de connexion)', () => {
      const req = buildRequest({ [OAUTH_STATE_COOKIE_NAME]: 'le-bon-nonce' });
      const callback = jest.fn();

      store.verify(req, 'nonce-different', callback);

      expect(callback).toHaveBeenCalledWith(
        null,
        false,
        expect.objectContaining({ message: expect.any(String) }),
      );
    });

    it("rejette si le cookie de nonce est absent (rejeu d'un callback sans être passé par /auth/google)", () => {
      const req = buildRequest();
      const callback = jest.fn();

      store.verify(req, 'un-etat-quelconque', callback);

      expect(callback).toHaveBeenCalledWith(
        null,
        false,
        expect.objectContaining({ message: expect.any(String) }),
      );
    });

    it('efface le cookie de nonce après vérification, succès ou échec (usage unique)', () => {
      const req = buildRequest({ [OAUTH_STATE_COOKIE_NAME]: 'x' });

      store.verify(req, 'y', jest.fn());

      expect(clearCookie).toHaveBeenCalledWith(OAUTH_STATE_COOKIE_NAME);
    });
  });
});
