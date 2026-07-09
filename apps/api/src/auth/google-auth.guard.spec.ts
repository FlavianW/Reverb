import { UnauthorizedException } from '@nestjs/common';
import { GoogleAuthGuard } from './google-auth.guard';

describe('GoogleAuthGuard', () => {
  let guard: GoogleAuthGuard;

  beforeEach(() => {
    guard = new GoogleAuthGuard();
  });

  it("renvoie le profil lorsque l'authentification a réussi", () => {
    const profile = { googleId: 'google-123', email: 'ana@example.com' };

    expect(guard.handleRequest(null, profile)).toBe(profile);
  });

  it('rejette avec un message clair si Google renvoie une erreur', () => {
    expect(() => guard.handleRequest(new Error('oauth error'), false)).toThrow(
      new UnauthorizedException("Échec de l'authentification Google."),
    );
  });

  it("rejette avec un message clair si aucun utilisateur n'est renvoyé", () => {
    expect(() => guard.handleRequest(null, false)).toThrow(
      new UnauthorizedException("Échec de l'authentification Google."),
    );
  });
});
