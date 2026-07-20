import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Champs à soumettre dans le `FormData` d'un upload direct vers `url` (S3 presigned POST). */
export interface PresignedUpload {
  url: string;
  fields: Record<string, string>;
}

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
    return this.publicUrl(key);
  }

  /** Supprime l'objet identifié par sa clé S3. */
  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  /**
   * URL publique résolue pour une clé, sans vérifier que l'objet existe
   * (même construction que celle utilisée après un `PutObject` réussi).
   */
  publicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }

  /**
   * Vérifie qu'un objet existe réellement dans le bucket. Utilisé pour ne
   * jamais faire confiance à une clé S3 fournie par un client sans
   * confirmation que l'upload a bien eu lieu.
   */
  async headObject(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * URL présignée pour un upload direct du client vers S3 (POST multipart),
   * avec la taille maximale imposée côté S3 (`content-length-range`) plutôt
   * que déclarée par le client — un client malveillant ne peut pas
   * contourner la limite en mentant sur les métadonnées envoyées à l'API.
   */
  async createPresignedUpload(
    key: string,
    contentType: string,
    maxSizeBytes: number,
  ): Promise<PresignedUpload> {
    const { url, fields } = await createPresignedPost(this.client, {
      Bucket: this.bucket,
      Key: key,
      Conditions: [
        ['content-length-range', 0, maxSizeBytes],
        ['eq', '$Content-Type', contentType],
      ],
      Fields: { 'Content-Type': contentType },
      Expires: 300,
    });
    return { url, fields };
  }
}
