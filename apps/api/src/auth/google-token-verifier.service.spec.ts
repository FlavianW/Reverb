import { ConfigService } from '@nestjs/config';
import { GoogleTokenVerifierService } from './google-token-verifier.service';

describe('GoogleTokenVerifierService', () => {
  let service: GoogleTokenVerifierService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('expected-client-id'),
    } as unknown as ConfigService;
    service = new GoogleTokenVerifierService(configService);

    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  const jsonResponse = (status: number, body: unknown) =>
    ({
      status,
      ok: status >= 200 && status < 300,
      json: () => Promise.resolve(body),
    }) as Response;

  it('renvoie le profil quand le token est valide et destiné à notre client', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        aud: 'expected-client-id',
        sub: 'google-123',
        email: 'ana@example.com',
        email_verified: 'true',
        name: 'Ana Étoile',
        picture: 'https://example.com/avatar.png',
      }),
    );

    const result = await service.verify('valid-token');

    expect(result).toEqual({
      googleId: 'google-123',
      email: 'ana@example.com',
      displayName: 'Ana Étoile',
      avatarUrl: 'https://example.com/avatar.png',
    });
  });

  it("renvoie null si l'audience ne correspond pas à notre client", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        aud: 'un-autre-client',
        sub: 'google-123',
        email: 'ana@example.com',
        email_verified: 'true',
      }),
    );

    const result = await service.verify('token-pour-une-autre-app');

    expect(result).toBeNull();
  });

  it("renvoie null si l'e-mail n'est pas vérifié par Google", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        aud: 'expected-client-id',
        sub: 'google-123',
        email: 'ana@example.com',
        email_verified: 'false',
      }),
    );

    const result = await service.verify('email-non-verifie');

    expect(result).toBeNull();
  });

  it('renvoie null si Google répond avec une erreur (token expiré/invalide)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(400, {}));

    const result = await service.verify('token-expire');

    expect(result).toBeNull();
  });

  it('renvoie null si la requête réseau échoue', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));

    const result = await service.verify('peu-importe');

    expect(result).toBeNull();
  });
});
