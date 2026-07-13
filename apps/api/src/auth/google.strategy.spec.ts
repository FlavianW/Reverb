import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Profile } from 'passport-google-oauth20';
import { GoogleStrategy } from './google.strategy';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  const configValues: Record<string, string> = {
    GOOGLE_CLIENT_ID: 'client-id',
    GOOGLE_CLIENT_SECRET: 'client-secret',
    GOOGLE_CALLBACK_URL: 'http://localhost:3000/auth/google/callback',
  };
  const configService = {
    getOrThrow: jest.fn((key: string) => configValues[key]),
  };

  beforeEach(() => {
    strategy = new GoogleStrategy(configService as unknown as ConfigService);
  });

  describe('validate', () => {
    it('traduit le profil Google en GoogleProfile interne', () => {
      const profile = {
        id: 'google-123',
        displayName: 'Ana Étoile',
        emails: [{ value: 'ana@example.com' }],
        photos: [{ value: 'https://example.com/avatar.png' }],
      } as unknown as Profile;

      const result = strategy.validate(
        'access-token',
        'refresh-token',
        profile,
      );

      expect(result).toEqual({
        googleId: 'google-123',
        email: 'ana@example.com',
        displayName: 'Ana Étoile',
        avatarUrl: 'https://example.com/avatar.png',
      });
    });

    it('rejette si Google ne fournit aucune adresse e-mail', () => {
      const profile = {
        id: 'google-123',
        displayName: 'Ana Étoile',
        emails: [],
        photos: [],
      } as unknown as Profile;

      expect(() =>
        strategy.validate('access-token', 'refresh-token', profile),
      ).toThrow(UnauthorizedException);
    });
  });
});
