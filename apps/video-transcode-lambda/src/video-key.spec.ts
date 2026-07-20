import { deriveOutputKeys, isOriginalVideoKey } from './video-key';

describe('isOriginalVideoKey', () => {
  it('accepte un original mp4 de concert', () => {
    expect(isOriginalVideoKey('concerts/concert-1/uuid/original.mp4')).toBe(
      true,
    );
  });

  it('accepte un original mov de post, insensible à la casse', () => {
    expect(isOriginalVideoKey('posts/post-1/ORIGINAL.MOV')).toBe(true);
  });

  it('refuse un rendu déjà produit par le Lambda (évite la boucle infinie)', () => {
    expect(isOriginalVideoKey('posts/post-1/playback.mp4')).toBe(false);
    expect(isOriginalVideoKey('posts/post-1/poster.jpg')).toBe(false);
  });

  it('refuse une extension non vidéo', () => {
    expect(isOriginalVideoKey('posts/post-1/original.txt')).toBe(false);
  });
});

describe('deriveOutputKeys', () => {
  it('dérive playback/poster dans le même dossier que l’original (concert)', () => {
    expect(deriveOutputKeys('concerts/concert-1/uuid/original.mp4')).toEqual({
      playbackKey: 'concerts/concert-1/uuid/playback.mp4',
      posterKey: 'concerts/concert-1/uuid/poster.jpg',
    });
  });

  it('dérive playback/poster dans le même dossier que l’original (post)', () => {
    expect(deriveOutputKeys('posts/post-1/original.mov')).toEqual({
      playbackKey: 'posts/post-1/playback.mp4',
      posterKey: 'posts/post-1/poster.jpg',
    });
  });
});
