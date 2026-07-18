import { ConfigService } from '@nestjs/config';
import { GeocodingService } from './geocoding.service';

describe('GeocodingService', () => {
  let service: GeocodingService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    service = new GeocodingService(configService);

    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  const jsonResponse = (status: number, body: unknown) =>
    ({
      status,
      ok: status >= 200 && status < 300,
      json: () => Promise.resolve(body),
    }) as Response;

  it('renvoie les coordonnées du premier résultat trouvé', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, [{ lat: '48.8566', lon: '2.3522' }]),
    );

    const result = await service.geocodeCity('Paris');

    expect(result).toEqual({ latitude: 48.8566, longitude: 2.3522 });
    const requestedUrl = fetchMock.mock.calls[0][0] as URL;
    expect(requestedUrl.searchParams.get('q')).toBe('Paris');
    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers['User-Agent']).toContain('Reverb');
  });

  it('renvoie null quand Nominatim ne trouve aucun résultat', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, []));

    const result = await service.geocodeCity('Ville inconnue');

    expect(result).toBeNull();
  });

  it('renvoie null si Nominatim répond avec une erreur serveur', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(500, {}));

    const result = await service.geocodeCity('Paris');

    expect(result).toBeNull();
  });

  it('renvoie null si la requête réseau échoue', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));

    const result = await service.geocodeCity('Paris');

    expect(result).toBeNull();
  });
});
