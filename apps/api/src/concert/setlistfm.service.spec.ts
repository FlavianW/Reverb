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

  describe('searchConcerts', () => {
    it('renvoie les concerts trouvés pour cet artiste', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(200, {
          setlist: [
            {
              artist: { name: 'Radiohead' },
              venue: { name: 'The O2 Arena', city: { name: 'London' } },
              eventDate: '24-11-2025',
            },
          ],
        }),
      );

      const result = await service.searchConcerts('radiohead');

      expect(result).toEqual([
        {
          artistName: 'Radiohead',
          venueName: 'The O2 Arena',
          city: 'London',
          date: new Date(Date.UTC(2025, 10, 24)),
        },
      ]);
      const requestedUrl = fetchMock.mock.calls[0][0] as URL;
      expect(requestedUrl.searchParams.get('artistName')).toBe('radiohead');
    });

    it('dédoublonne les entrées identiques (même artiste/salle/ville/date)', async () => {
      const entry = {
        artist: { name: 'Radiohead' },
        venue: { name: 'The O2 Arena', city: { name: 'London' } },
        eventDate: '24-11-2025',
      };
      fetchMock.mockResolvedValueOnce(
        jsonResponse(200, { setlist: [entry, entry] }),
      );

      const result = await service.searchConcerts('radiohead');

      expect(result).toHaveLength(1);
    });

    it('ignore les entrées incomplètes (salle, ville ou date manquante)', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(200, {
          setlist: [
            {
              artist: { name: 'Radiohead' },
              venue: {},
              eventDate: '24-11-2025',
            },
          ],
        }),
      );

      const result = await service.searchConcerts('radiohead');

      expect(result).toEqual([]);
    });

    it('renvoie une liste vide quand Setlist.fm ne trouve aucun artiste (404)', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(404, {}));

      const result = await service.searchConcerts('artiste inconnu');

      expect(result).toEqual([]);
    });

    it("renvoie une liste vide si l'API Setlist.fm répond avec une erreur serveur", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(500, {}));

      const result = await service.searchConcerts('radiohead');

      expect(result).toEqual([]);
    });

    it('renvoie une liste vide si la requête réseau échoue', async () => {
      fetchMock.mockRejectedValueOnce(new Error('network down'));

      const result = await service.searchConcerts('radiohead');

      expect(result).toEqual([]);
    });
  });
});
