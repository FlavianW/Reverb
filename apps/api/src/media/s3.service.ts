import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Accès au stockage objet (S3 en production, MinIO en local — même API).
 * `forcePathStyle` est requis par MinIO ; il reste compatible avec un vrai
 * bucket AWS S3.
 */
@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.getOrThrow<string>('S3_BUCKET');
    this.publicBaseUrl =
      this.configService.getOrThrow<string>('S3_PUBLIC_BASE_URL');
    this.client = new S3Client({
      region: this.configService.getOrThrow<string>('S3_REGION'),
      endpoint: this.configService.get<string>('S3_ENDPOINT'),
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('S3_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>(
          'S3_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  /** Dépose l'objet et renvoie son URL publique. */
  async uploadObject(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return `${this.publicBaseUrl}/${key}`;
  }

  /** Supprime l'objet identifié par sa clé S3. */
  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
