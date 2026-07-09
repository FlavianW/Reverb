import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  it('vérifie positivement un mot de passe contre son propre hash', async () => {
    const passwordHash = await service.hashPassword(
      'correct horse battery staple',
    );

    await expect(
      service.verifyPassword('correct horse battery staple', passwordHash),
    ).resolves.toBe(true);
  });

  it('rejette un mot de passe incorrect', async () => {
    const passwordHash = await service.hashPassword(
      'correct horse battery staple',
    );

    await expect(
      service.verifyPassword('wrong password', passwordHash),
    ).resolves.toBe(false);
  });

  it('ne stocke jamais le mot de passe en clair dans le hash', async () => {
    const passwordHash = await service.hashPassword(
      'correct horse battery staple',
    );

    expect(passwordHash).not.toContain('correct horse battery staple');
  });
});
