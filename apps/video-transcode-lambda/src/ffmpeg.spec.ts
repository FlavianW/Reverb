import {
  buildDurationProbeArgs,
  buildPlaybackArgs,
  buildPosterArgs,
  parseDurationSeconds,
} from './ffmpeg';

describe('buildPlaybackArgs', () => {
  it('encode en H.264/AAC plafonné à 1280px de large', () => {
    const args = buildPlaybackArgs('/tmp/in.mp4', '/tmp/out.mp4');

    expect(args).toContain('/tmp/in.mp4');
    expect(args).toContain('/tmp/out.mp4');
    expect(args).toContain('libx264');
    expect(args).toContain('aac');
    expect(args).toEqual(expect.arrayContaining(["scale='min(1280,iw)':-2"]));
  });
});

describe('buildPosterArgs', () => {
  it('extrait une frame à la 1re seconde', () => {
    const args = buildPosterArgs('/tmp/in.mp4', '/tmp/poster.jpg');

    expect(args).toEqual(
      expect.arrayContaining([
        '-ss',
        '00:00:01',
        '-vframes',
        '1',
        '/tmp/poster.jpg',
      ]),
    );
  });
});

describe('buildDurationProbeArgs', () => {
  it('interroge ffprobe pour la seule durée du format', () => {
    expect(buildDurationProbeArgs('/tmp/in.mp4')).toEqual(
      expect.arrayContaining([
        '-show_entries',
        'format=duration',
        '/tmp/in.mp4',
      ]),
    );
  });
});

describe('parseDurationSeconds', () => {
  it('arrondit la durée flottante renvoyée par ffprobe', () => {
    expect(parseDurationSeconds('42.837000\n')).toBe(43);
  });

  it('renvoie undefined si ffprobe ne renvoie rien d’exploitable', () => {
    expect(parseDurationSeconds('N/A\n')).toBeUndefined();
  });
});
