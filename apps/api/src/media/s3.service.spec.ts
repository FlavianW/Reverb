import type { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';

const sendMock = jest.fn();
const createPresignedPostMock = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: sendMock })),
  PutObjectCommand: jest
    .fn()
    .mockImplementation((input: unknown) => ({ input })),
  DeleteObjectCommand: jest
    .fn()
    .mockImplementation((input: unknown) => ({ input })),
  HeadObjectCommand: jest
    .fn()
    .mockImplementation((input: unknown) => ({ input })),
}));

jest.mock('@aws-sdk/s3-presigned-post', () => ({
  createPresignedPost: (
    ...args: unknown[]
  ): Promise<{ url: string; fields: Record<string, string> }> =>
    createPresignedPostMock(...args) as Promise<{
      url: string;
      fields: Record<string, string>;
    }>,
}));

describe('S3Service', () => {
  let service: S3Service;

  const configValues: Record<string, string> = {
    S3_BUCKET: 'reverb-media',
    S3_PUBLIC_BASE_URL: 'http://localhost:9000/reverb-media',
    S3_REGION: 'eu-west-3',
    S3_ACCESS_KEY_ID: 'reverb',
    S3_SECRET_ACCESS_KEY: 'reverb-minio',
  };
  const configService = {
    getOrThrow: jest.fn((key: string) => configValues[key]),
    get: jest.fn().mockReturnValue(undefined),
  };

  beforeEach(() => {
    sendMock.mockReset().mockResolvedValue({});
    createPresignedPostMock.mockReset();
    service = new S3Service(configService as unknown as ConfigService);
  });

  it("dépose l'objet et renvoie son URL publique construite à partir de la clé", async () => {
    const url = await service.uploadObject(
      'concerts/concert-1/photo.jpg',
      Buffer.from('contenu-image'),
      'image/jpeg',
    );

    expect(sendMock).toHaveBeenCalledTimes(1);
    const command = sendMock.mock.calls[0][0] as {
      input: { Bucket: string; Key: string; ContentType: string };
    };
    expect(command.input).toEqual({
      Bucket: 'reverb-media',
      Key: 'concerts/concert-1/photo.jpg',
      Body: Buffer.from('contenu-image'),
      ContentType: 'image/jpeg',
    });
    expect(url).toBe(
      'http://localhost:9000/reverb-media/concerts/concert-1/photo.jpg',
    );
  });

  it("supprime l'objet identifié par sa clé", async () => {
    await service.deleteObject('concerts/concert-1/photo.jpg');

    expect(sendMock).toHaveBeenCalledTimes(1);
    const command = sendMock.mock.calls[0][0] as {
      input: { Bucket: string; Key: string };
    };
    expect(command.input).toEqual({
      Bucket: 'reverb-media',
      Key: 'concerts/concert-1/photo.jpg',
    });
  });

  describe('publicUrl', () => {
    it('résout la même URL que celle renvoyée après un upload', () => {
      expect(service.publicUrl('posts/post-1/original.mp4')).toBe(
        'http://localhost:9000/reverb-media/posts/post-1/original.mp4',
      );
    });
  });

  describe('headObject', () => {
    it("renvoie true quand l'objet existe", async () => {
      sendMock.mockResolvedValueOnce({});

      await expect(
        service.headObject('posts/post-1/original.mp4'),
      ).resolves.toBe(true);
    });

    it("renvoie false quand l'objet n'existe pas (erreur NotFound)", async () => {
      const notFound = new Error('not found');
      notFound.name = 'NotFound';
      sendMock.mockRejectedValueOnce(notFound);

      await expect(
        service.headObject('posts/post-1/original.mp4'),
      ).resolves.toBe(false);
    });

    it('relance toute autre erreur inattendue', async () => {
      sendMock.mockRejectedValueOnce(new Error('S3 down'));

      await expect(
        service.headObject('posts/post-1/original.mp4'),
      ).rejects.toThrow('S3 down');
    });
  });

  describe('createPresignedUpload', () => {
    it('délègue à createPresignedPost avec la taille max et le type MIME imposés', async () => {
      createPresignedPostMock.mockResolvedValueOnce({
        url: 'http://localhost:9000/reverb-media',
        fields: { key: 'posts/post-1/original.mp4' },
      });

      const result = await service.createPresignedUpload(
        'posts/post-1/original.mp4',
        'video/mp4',
        150 * 1024 * 1024,
      );

      expect(createPresignedPostMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          Bucket: 'reverb-media',
          Key: 'posts/post-1/original.mp4',
          Conditions: [
            ['content-length-range', 0, 150 * 1024 * 1024],
            ['eq', '$Content-Type', 'video/mp4'],
          ],
          Fields: { 'Content-Type': 'video/mp4' },
        }),
      );
      expect(result).toEqual({
        url: 'http://localhost:9000/reverb-media',
        fields: { key: 'posts/post-1/original.mp4' },
      });
    });
  });
});
