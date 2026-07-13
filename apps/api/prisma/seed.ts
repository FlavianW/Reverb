import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

/** Jeu de données minimal pour explorer l'application en local. */
async function main() {
  const passwordHash = await hash('password123', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@reverb.fr' },
    update: {},
    create: {
      email: 'demo@reverb.fr',
      pseudo: 'demo',
      passwordHash,
      bio: 'Compte de démonstration.',
    },
  });

  await prisma.concert.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      artistName: 'Muse',
      venueName: 'AccorHotels Arena',
      city: 'Paris',
      date: new Date('2024-06-15'),
      createdById: demoUser.id,
    },
  });

  await prisma.concert.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      artistName: 'Radiohead',
      venueName: 'Zénith',
      city: 'Lyon',
      date: new Date('2026-12-01'),
      createdById: demoUser.id,
    },
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
