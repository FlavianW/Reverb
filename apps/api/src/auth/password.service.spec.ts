import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  it('vérifie positivement un mot de passe contre son propre hash', async () => {
    const passwordHash = await service.hashPassword('MotDePasse123!');

    await expect(
      service.verifyPassword('MotDePasse123!', passwordHash),
    ).resolves.toBe(true);
  });

  it('rejette un mot de passe incorrect', async () => {
    const passwordHash = await service.hashPassword('MotDePasse123!');

    await expect(
      service.verifyPassword('AutreMotDePasse456!', passwordHash),
    ).resolves.toBe(false);
  });

  it('ne stocke jamais le mot de passe en clair dans le hash', async () => {
    const passwordHash = await service.hashPassword('MotDePasse123!');

    expect(passwordHash).not.toContain('MotDePasse123!');
  });
});
