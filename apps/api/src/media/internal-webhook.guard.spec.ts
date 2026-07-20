import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { InternalWebhookGuard } from './internal-webhook.guard';

function contextWithHeader(value: string | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        header: (name: string) =>
          name === 'x-internal-secret' ? value : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('InternalWebhookGuard', () => {
  const configService = {
    getOrThrow: jest.fn().mockReturnValue('le-bon-secret'),
  };
  let guard: InternalWebhookGuard;

  beforeEach(() => {
    guard = new InternalWebhookGuard(configService as unknown as ConfigService);
  });

  it('autorise la requête quand le secret correspond', () => {
    expect(guard.canActivate(contextWithHeader('le-bon-secret'))).toBe(true);
  });

  it('rejette quand le secret est absent', () => {
    expect(() => guard.canActivate(contextWithHeader(undefined))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejette quand le secret ne correspond pas', () => {
    expect(() =>
      guard.canActivate(contextWithHeader('mauvais-secret')),
    ).toThrow(UnauthorizedException);
  });
});
