import { Controller, Get } from '@nestjs/common';

/**
 * Endpoint de supervision utilisé par la cible ECS/ALB pour vérifier
 * que l'instance de l'API est démarrée et répond.
 */
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
