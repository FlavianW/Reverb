import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

/**
 * Protège les endpoints internes appelés par le Lambda de transcodage.
 * Authentification par secret partagé (SSM en production), pas par JWT
 * utilisateur : l'appelant n'est jamais un navigateur ou l'app mobile.
 */
@Injectable()
export class InternalWebhookGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.header('x-internal-secret');
    const expected = this.configService.getOrThrow<string>(
      'VIDEO_WEBHOOK_SECRET',
    );

    if (!provided || provided !== expected) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
