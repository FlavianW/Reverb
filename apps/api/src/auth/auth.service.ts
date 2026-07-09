import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

/** Contenu du payload JWT de session : uniquement l'identifiant utilisateur. */
export interface SessionTokenPayload {
  sub: string;
}

/**
 * Émet le JWT de session (US-1.2). Aucun mot de passe local à vérifier :
 * le jeton est délivré juste après une authentification Google réussie.
 */
@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  issueSessionToken(user: Pick<User, 'id'>): string {
    const payload: SessionTokenPayload = { sub: user.id };
    return this.jwtService.sign(payload);
  }
}
