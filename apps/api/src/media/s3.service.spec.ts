import type { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';

const sendMock = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: sendMock })),
  PutObjectCommand: jest
    .fn()
    .mockImplementation((input: unknown) => ({ input })),
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
});
