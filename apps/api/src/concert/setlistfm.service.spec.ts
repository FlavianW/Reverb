import { ConfigService } from '@nestjs/config';
import { SetlistFmService } from './setlistfm.service';

describe('SetlistFmService', () => {
  let service: SetlistFmService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('test-api-key'),
    } as unknown as ConfigService;
    service = new SetlistFmService(configService);

    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  const jsonResponse = (status: number, body: unknown) =>
    ({
      status,
      ok: status >= 200 && status < 300,
      json: () => Promise.resolve(body),
    }) as Response;

  describe('findSetlist', () => {
    it('renvoie la liste des titres jouées quand Setlist.fm trouve un résultat', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(200, {
          setlist: [
            {
              sets: {
                set: [
                  { song: [{ name: 'Song A' }, { name: 'Song B' }] },
                  { song: [{ name: 'Song C' }] },
                ],
              },
            },
          ],
        }),
      );

      const result = await service.findSetlist({
        artistName: 'Muse',
        city: 'Paris',
        date: new Date(Date.UTC(2024, 5, 15)),
      });

      expect(result).toEqual({ songs: ['Song A', 'Song B', 'Song C'] });
      const requestedUrl = fetchMock.mock.calls[0][0] as URL;
      expect(requestedUrl.searchParams.get('date')).toBe('15-06-2024');
    });

    it('renvoie null quand Setlist.fm ne trouve aucune setlist (404)', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(404, {}));

      const result = await service.findSetlist({
        artistName: 'Artiste inconnu',
        city: 'Paris',
        date: new Date(Date.UTC(2024, 5, 15)),
      });

      expect(result).toBeNull();
    });

    it("renvoie null si l'API Setlist.fm répond avec une erreur serveur", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(500, {}));

      const result = await service.findSetlist({
        artistName: 'Muse',
        city: 'Paris',
        date: new Date(Date.UTC(2024, 5, 15)),
      });

      expect(result).toBeNull();
    });

    it('renvoie null si la requête réseau échoue', async () => {
      fetchMock.mockRejectedValueOnce(new Error('network down'));

      const result = await service.findSetlist({
        artistName: 'Muse',
        city: 'Paris',
        date: new Date(Date.UTC(2024, 5, 15)),
      });

      expect(result).toBeNull();
    });
  });
});
