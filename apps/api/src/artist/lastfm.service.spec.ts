import { ConfigService } from '@nestjs/config';
import { LastFmService } from './lastfm.service';

describe('LastFmService', () => {
  let service: LastFmService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('test-api-key'),
      get: jest.fn().mockReturnValue(undefined),
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

  const htmlResponse = (status: number, html: string) =>
    ({
      status,
      ok: status >= 200 && status < 300,
      text: () => Promise.resolve(html),
    }) as Response;

  const ogImageHtml = (url: string) =>
    `<html><head><meta property="og:image" content="${url}" data-replaceable-head-tag></head></html>`;

  const image = (size: string, url: string) => ({ '#text': url, size });

  describe('searchArtists', () => {
    it('renvoie les artistes trouvés, avec leur image si ce n’est pas le placeholder connu', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(200, {
          results: {
            artistmatches: {
              artist: [
                {
                  name: 'Un vrai groupe indépendant',
                  image: [
                    image('small', 'https://example.com/small.jpg'),
                    image('extralarge', 'https://example.com/xl.jpg'),
                  ],
                },
              ],
            },
          },
        }),
      );

      const result = await service.searchArtists('un vrai');

      expect(result).toEqual([
        {
          name: 'Un vrai groupe indépendant',
          imageUrl: 'https://example.com/xl.jpg',
        },
      ]);
      const requestedUrl = fetchMock.mock.calls[0][0] as URL;
      expect(requestedUrl.searchParams.get('method')).toBe('artist.search');
      expect(requestedUrl.searchParams.get('artist')).toBe('un vrai');
    });

    it('filtre le placeholder générique connu de Last.fm (imageUrl: null)', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(200, {
          results: {
            artistmatches: {
              artist: [
                {
                  name: 'Muse',
                  image: [
                    image(
                      'extralarge',
                      'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png',
                    ),
                  ],
                },
              ],
            },
          },
        }),
      );

      const result = await service.searchArtists('muse');

      expect(result).toEqual([{ name: 'Muse', imageUrl: null }]);
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
    it("renvoie la photo extraite de la balise og:image de la page publique de l'artiste", async () => {
      fetchMock.mockResolvedValueOnce(
        htmlResponse(
          200,
          ogImageHtml(
            'https://lastfm.freetls.fastly.net/i/u/ar0/0ad534dfa02f492d917ff7d71e65bd7f.jpg',
          ),
        ),
      );

      const result = await service.getArtistImage('Radiohead');

      expect(result).toBe(
        'https://lastfm.freetls.fastly.net/i/u/ar0/0ad534dfa02f492d917ff7d71e65bd7f.jpg',
      );
      const requestedUrl = fetchMock.mock.calls[0][0] as string;
      expect(requestedUrl).toBe('https://www.last.fm/music/Radiohead');
    });

    it("encode le nom de l'artiste dans l'URL de la page", async () => {
      fetchMock.mockResolvedValueOnce(htmlResponse(200, ogImageHtml('')));

      await service.getArtistImage('Sigur Rós');

      const requestedUrl = fetchMock.mock.calls[0][0] as string;
      expect(requestedUrl).toBe('https://www.last.fm/music/Sigur%20R%C3%B3s');
    });

    it("renvoie null si l'og:image n'est pas une vraie photo d'artiste (repli générique)", async () => {
      fetchMock.mockResolvedValueOnce(
        htmlResponse(
          200,
          ogImageHtml(
            'https://www.last.fm/static/images/lastfm_logo_facebook.png',
          ),
        ),
      );

      const result = await service.getArtistImage('Artiste inconnu');

      expect(result).toBeNull();
    });

    it('renvoie null si la page ne contient aucune balise og:image', async () => {
      fetchMock.mockResolvedValueOnce(htmlResponse(200, '<html></html>'));

      const result = await service.getArtistImage('Muse');

      expect(result).toBeNull();
    });

    it("renvoie null si la page de l'artiste est introuvable (404)", async () => {
      fetchMock.mockResolvedValueOnce(
        htmlResponse(404, ogImageHtml('https://x')),
      );

      const result = await service.getArtistImage('Artiste inconnu');

      expect(result).toBeNull();
    });

    it('renvoie null si la requête réseau échoue', async () => {
      fetchMock.mockRejectedValueOnce(new Error('network down'));

      const result = await service.getArtistImage('Muse');

      expect(result).toBeNull();
    });

    it('met la photo en cache : un second appel ne rescrape pas la page', async () => {
      fetchMock.mockResolvedValueOnce(
        htmlResponse(
          200,
          ogImageHtml('https://lastfm.freetls.fastly.net/i/u/ar0/muse.jpg'),
        ),
      );

      await service.getArtistImage('Muse');
      const result = await service.getArtistImage('muse');

      expect(result).toBe('https://lastfm.freetls.fastly.net/i/u/ar0/muse.jpg');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('sert la dernière photo connue (même périmée) quand Last.fm échoue', async () => {
      const nowSpy = jest.spyOn(Date, 'now');
      try {
        nowSpy.mockReturnValue(0);
        fetchMock.mockResolvedValueOnce(
          htmlResponse(
            200,
            ogImageHtml('https://lastfm.freetls.fastly.net/i/u/ar0/muse.jpg'),
          ),
        );
        await service.getArtistImage('Muse');

        // Cache périmé (25 h plus tard) et Last.fm en panne (406 anti-bot).
        nowSpy.mockReturnValue(25 * 60 * 60 * 1000);
        fetchMock.mockResolvedValueOnce(htmlResponse(406, ''));

        const result = await service.getArtistImage('Muse');

        expect(result).toBe(
          'https://lastfm.freetls.fastly.net/i/u/ar0/muse.jpg',
        );
        expect(fetchMock).toHaveBeenCalledTimes(2);
      } finally {
        nowSpy.mockRestore();
      }
    });
  });
});
