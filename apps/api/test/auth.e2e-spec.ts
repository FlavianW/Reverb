import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

/** Un compte différent par exécution, pour éviter les collisions d'email/pseudo. */
const uniqueUser = () => {
  const suffix = randomUUID().slice(0, 8);
  return {
    email: `e2e-${suffix}@reverb.test`,
    password: 'MotDePasse123!',
    pseudo: `e2e-${suffix}`,
  };
};

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Reproduit la config de main.ts nécessaire au parcours testé (cookie
    // de session, validation des DTO).
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { endsWith: '@reverb.test' } },
    });
    await app.close();
  });

  it('inscrit un compte, ouvre une session (US-1.1 bis), puis relogue avec les mêmes identifiants (US-1.2 bis)', async () => {
    const user = uniqueUser();

    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send(user)
      .expect(201);
    expect(registerRes.body).toMatchObject({
      email: user.email,
      pseudo: user.pseudo,
    });

    const sessionCookie = registerRes.get('Set-Cookie');
    expect(sessionCookie).toBeDefined();

    const meRes = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', sessionCookie ?? [])
      .expect(200);
    expect((meRes.body as { email: string }).email).toBe(user.email);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(200);
    expect((loginRes.body as { email: string }).email).toBe(user.email);
  });

  it('rejette une connexion avec un mot de passe incorrect', async () => {
    const user = uniqueUser();
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(user)
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: 'MotDePasseIncorrect123!' })
      .expect(401);
  });
});
