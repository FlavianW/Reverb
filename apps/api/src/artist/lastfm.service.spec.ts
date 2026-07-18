import { ConfigService } from '@nestjs/config';
import { LastFmService } from './lastfm.service';

describe('LastFmService', () => {
  let service: LastFmService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('test-api-key'),
    } as unknown as ConfigService;
    service = new LastFmService(configService);

    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  const jsonResponse = (status: number, body: unknown) =>
    ({
      status,
      ok: status >= 200 && status < 300,
      json: () => Promise.resolve(body),
    }) as Response;

  const image = (size: string, url: string) => ({ '#text': url, size });

  describe('searchArtists', () => {
    it('renvoie les artistes trouvés avec leur plus grande image disponible', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(200, {
          results: {
            artistmatches: {
              artist: [
                {
                  name: 'Muse',
                  image: [
                    image('small', 'https://example.com/muse-small.jpg'),
                    image('extralarge', 'https://example.com/muse-xl.jpg'),
                  ],
                },
              ],
            },
          },
        }),
      );

      const result = await service.searchArtists('mus');

      expect(result).toEqual([
        { name: 'Muse', imageUrl: 'https://example.com/muse-xl.jpg' },
      ]);
      const requestedUrl = fetchMock.mock.calls[0][0] as URL;
      expect(requestedUrl.searchParams.get('method')).toBe('artist.search');
      expect(requestedUrl.searchParams.get('artist')).toBe('mus');
    });

    it('gère le cas où Last.fm renvoie un seul artiste (objet, pas tableau)', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(200, {
          results: {
            artistmatches: {
              artist: { name: 'Muse', image: [] },
            },
          },
        }),
      );

      const result = await service.searchArtists('muse');

      expect(result).toEqual([{ name: 'Muse', imageUrl: null }]);
    });

    it('renvoie une liste vide quand Last.fm ne trouve aucun artiste', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(200, { results: { artistmatches: {} } }),
      );

      const result = await service.searchArtists('zzz');

      expect(result).toEqual([]);
    });

    it("renvoie une liste vide si l'API Last.fm répond avec une erreur", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(500, {}));

      const result = await service.searchArtists('muse');

      expect(result).toEqual([]);
    });

    it('renvoie une liste vide si la requête réseau échoue', async () => {
      fetchMock.mockRejectedValueOnce(new Error('network down'));

      const result = await service.searchArtists('muse');

      expect(result).toEqual([]);
    });
  });

  describe('getArtistImage', () => {
    it("renvoie l'image la plus grande disponible", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(200, {
          artist: {
            image: [
              image('medium', 'https://example.com/muse-medium.jpg'),
              image('large', 'https://example.com/muse-large.jpg'),
            ],
          },
        }),
      );

      const result = await service.getArtistImage('Muse');

      expect(result).toBe('https://example.com/muse-large.jpg');
      const requestedUrl = fetchMock.mock.calls[0][0] as URL;
      expect(requestedUrl.searchParams.get('method')).toBe('artist.getinfo');
      expect(requestedUrl.searchParams.get('artist')).toBe('Muse');
    });

    it("renvoie null si aucune des tailles d'image n'a d'URL non vide", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(200, {
          artist: { image: [image('extralarge', '')] },
        }),
      );

      const result = await service.getArtistImage('Muse');

      expect(result).toBeNull();
    });

    it('renvoie null si Last.fm ne connaît pas cet artiste', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(200, {}));

      const result = await service.getArtistImage('Artiste inconnu');

      expect(result).toBeNull();
    });

    it("renvoie null si l'API Last.fm répond avec une erreur", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(500, {}));

      const result = await service.getArtistImage('Muse');

      expect(result).toBeNull();
    });

    it('renvoie null si la requête réseau échoue', async () => {
      fetchMock.mockRejectedValueOnce(new Error('network down'));

      const result = await service.getArtistImage('Muse');

      expect(result).toBeNull();
    });
  });
});
