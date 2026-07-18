import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GoogleProfile } from '../user/user.service';

const TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

interface GoogleTokenInfo {
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: string;
  name?: string;
  picture?: string;
}

/**
 * Vérifie les ID tokens Google émis côté mobile par `google_sign_in` (US-1.1).
 * Utilise l'endpoint `tokeninfo` de Google plutôt qu'une bibliothèque dédiée
 * (`google-auth-library`) : suffisant au volume d'un MVP, cohérent avec les
 * appels `fetch` déjà utilisés pour Setlist.fm et le géocodage.
 */
@Injectable()
export class GoogleTokenVerifierService {
  private readonly logger = new Logger(GoogleTokenVerifierService.name);

  constructor(private readonly configService: ConfigService) {}

  async verify(idToken: string): Promise<GoogleProfile | null> {
    try {
      const url = new URL(TOKENINFO_URL);
      url.searchParams.set('id_token', idToken);

      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }

      const info = (await response.json()) as GoogleTokenInfo;
      const expectedAudience =
        this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID');

      if (
        info.aud !== expectedAudience ||
        info.email_verified !== 'true' ||
        !info.sub ||
        !info.email
      ) {
        return null;
      }

      return {
        googleId: info.sub,
        email: info.email,
        displayName: info.name ?? info.email,
        avatarUrl: info.picture,
      };
    } catch (error) {
      this.logger.warn(
        `Échec de la vérification de l'ID token Google : ${(error as Error).message}`,
      );
      return null;
    }
  }
}
