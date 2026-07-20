import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Endpoint de supervision utilisé par la cible ECS/ALB pour vérifier
 * que l'instance de l'API est démarrée et peut effectivement servir des requêtes.
 * Une API qui répond mais n'a plus accès à la base est aussi inutilisable qu'une
 * instance arrêtée : le check échoue donc si la base n'est pas joignable, pour
 * qu'ECS retire l'instance de la rotation au lieu de la laisser recevoir du trafic.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<{ status: 'ok' }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ status: 'error', reason: 'database unreachable' });
    }
    return { status: 'ok' };
  }
}
