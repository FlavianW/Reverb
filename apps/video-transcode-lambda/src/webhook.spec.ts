import { notifyComplete, notifyFailed } from './webhook';

const fetchMock: jest.MockedFunction<typeof fetch> = jest.fn();

describe('notifyComplete', () => {
  const config = {
    baseUrl: 'https://api.reverb-social.com/internal/videos',
    secret: 'le-secret',
  };

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it('poste le payload complet avec le secret en en-tête', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await notifyComplete(config, {
      originalKey: 'posts/post-1/original.mp4',
      playbackKey: 'posts/post-1/playback.mp4',
      posterKey: 'posts/post-1/poster.jpg',
      durationSeconds: 42,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.reverb-social.com/internal/videos/complete',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'X-Internal-Secret': 'le-secret' }),
        body: JSON.stringify({
          originalKey: 'posts/post-1/original.mp4',
          playbackKey: 'posts/post-1/playback.mp4',
          posterKey: 'posts/post-1/poster.jpg',
          durationSeconds: 42,
        }),
      }),
    );
  });

  it("lève une erreur explicite si l'API répond en erreur", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));

    await expect(
      notifyComplete(config, {
        originalKey: 'posts/post-1/original.mp4',
        playbackKey: 'posts/post-1/playback.mp4',
        posterKey: 'posts/post-1/poster.jpg',
      }),
    ).rejects.toThrow(/500/);
  });
});

describe('notifyFailed', () => {
  const config = {
    baseUrl: 'https://api.reverb-social.com/internal/videos',
    secret: 'le-secret',
  };

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it("poste la clé originale sur l'endpoint fail", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await notifyFailed(config, 'posts/post-1/original.mp4');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.reverb-social.com/internal/videos/fail',
      expect.objectContaining({
        body: JSON.stringify({ originalKey: 'posts/post-1/original.mp4' }),
      }),
    );
  });
});
