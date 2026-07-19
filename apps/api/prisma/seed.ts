import { PostType, PrismaClient, User } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Identifiants fixes pour que le seed reste idempotent (`upsert` partout) :
 * relancer `prisma db seed` ne duplique jamais les données.
 */
const CONCERT_IDS = {
  muse: '00000000-0000-0000-0000-000000000001',
  radiohead: '00000000-0000-0000-0000-000000000002',
  justice: '00000000-0000-0000-0000-000000000003',
  fontaines: '00000000-0000-0000-0000-000000000004',
  cure: '00000000-0000-0000-0000-000000000005',
  air: '00000000-0000-0000-0000-000000000006',
};

const daysAgo = (days: number): Date =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const daysFromNow = (days: number): Date => daysAgo(-days);

/** Amitié acceptée entre deux comptes, quel que soit le sens d'une éventuelle demande existante. */
async function ensureFriends(userAId: string, userBId: string): Promise<void> {
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userAId, addresseeId: userBId },
        { requesterId: userBId, addresseeId: userAId },
      ],
    },
  });

  if (existing) {
    if (existing.status !== 'ACCEPTED') {
      await prisma.friendship.update({
        where: { id: existing.id },
        data: { status: 'ACCEPTED' },
      });
    }
    return;
  }

  await prisma.friendship.create({
    data: { requesterId: userAId, addresseeId: userBId, status: 'ACCEPTED' },
  });
}

/**
 * Post du fil avec, selon son type, la ligne métier qui l'aurait généré en
 * conditions réelles (note ou présence) — le seed reproduit l'état qu'aurait
 * produit l'application, pas seulement la table `posts`.
 */
async function seedPost(input: {
  id: string;
  type: PostType;
  authorId: string;
  concertId?: string;
  content?: string;
  ratingValue?: number;
  createdDaysAgo: number;
}): Promise<void> {
  await prisma.post.upsert({
    where: { id: input.id },
    update: {},
    create: {
      id: input.id,
      type: input.type,
      authorId: input.authorId,
      concertId: input.concertId,
      content: input.content,
      ratingValue: input.ratingValue,
      createdAt: daysAgo(input.createdDaysAgo),
    },
  });

  if (input.type === 'RATING' && input.concertId && input.ratingValue) {
    await prisma.concertRating.upsert({
      where: {
        userId_concertId: {
          userId: input.authorId,
          concertId: input.concertId,
        },
      },
      update: {},
      create: {
        userId: input.authorId,
        concertId: input.concertId,
        value: input.ratingValue,
      },
    });
  }

  if (input.type === 'ATTENDANCE' && input.concertId) {
    await prisma.concertAttendance.upsert({
      where: {
        userId_concertId: {
          userId: input.authorId,
          concertId: input.concertId,
        },
      },
      update: {},
      create: { userId: input.authorId, concertId: input.concertId },
    });
  }
}

/** Jeu de données pour explorer l'application en local : comptes, concerts, fil d'actualité. */
async function main() {
  const passwordHash = await hash('password123', 10);

  const demoAccounts: Array<{
    email: string;
    pseudo: string;
    bio: string;
    favoriteArtist: string | null;
  }> = [
    {
      email: 'demo@reverb.fr',
      pseudo: 'demo',
      bio: 'Compte de démonstration.',
      favoriteArtist: 'Radiohead',
    },
    {
      email: 'demo2@reverb.fr',
      pseudo: 'demo2',
      bio: 'Deuxième compte de démonstration.',
      favoriteArtist: null,
    },
    {
      email: 'lea@reverb.fr',
      pseudo: 'lea-encore',
      bio: 'Toujours au premier rang, jamais rentrée avant le rappel.',
      favoriteArtist: 'Radiohead',
    },
    {
      email: 'marco@reverb.fr',
      pseudo: 'marco-riff',
      bio: 'Je note les setlists plus sévèrement que les profs.',
      favoriteArtist: 'Justice',
    },
    {
      email: 'nina@reverb.fr',
      pseudo: 'nina-fuzz',
      bio: 'Fan de murs de son et de pédales de fuzz.',
      favoriteArtist: 'Fontaines D.C.',
    },
  ];

  const demoUsers: User[] = [];
  for (const account of demoAccounts) {
    demoUsers.push(
      await prisma.user.upsert({
        where: { email: account.email },
        update: { bio: account.bio, favoriteArtist: account.favoriteArtist },
        create: { ...account, passwordHash },
      }),
    );
  }
  const [demo, demo2, lea, marco, nina] = demoUsers;

  // Les comptes de démo sont amis entre eux ET avec tous les comptes déjà
  // présents en base (dont le vôtre) : le fil d'actualité et l'accueil ont
  // ainsi du contenu dès la première connexion, sans étape manuelle.
  const otherUsers = await prisma.user.findMany({
    where: { email: { notIn: demoAccounts.map((account) => account.email) } },
  });
  const everyone = [...demoUsers, ...otherUsers];
  for (let i = 0; i < demoUsers.length; i += 1) {
    for (const other of everyone) {
      if (other.id !== demoUsers[i].id) {
        await ensureFriends(demoUsers[i].id, other.id);
      }
    }
  }

  // Coordonnées à précision ville/salle pour la carte de proximité (US-9.1).
  await prisma.concert.upsert({
    where: { id: CONCERT_IDS.muse },
    update: { latitude: 48.8384, longitude: 2.3781 },
    create: {
      id: CONCERT_IDS.muse,
      artistName: 'Muse',
      venueName: 'AccorHotels Arena',
      city: 'Paris',
      date: new Date('2024-06-15'),
      latitude: 48.8384,
      longitude: 2.3781,
      createdById: demo.id,
    },
  });

  // Concert réel documenté sur Setlist.fm : démontre la récupération de
  // setlist (US-2.1), à la différence du concert Muse ci-dessus qui illustre
  // l'état « setlist indisponible ».
  await prisma.concert.upsert({
    where: { id: CONCERT_IDS.radiohead },
    update: {
      venueName: 'The O2 Arena',
      city: 'London',
      date: new Date('2025-11-24'),
      latitude: 51.503,
      longitude: 0.0032,
    },
    create: {
      id: CONCERT_IDS.radiohead,
      artistName: 'Radiohead',
      venueName: 'The O2 Arena',
      city: 'London',
      date: new Date('2025-11-24'),
      latitude: 51.503,
      longitude: 0.0032,
      createdById: demo.id,
    },
  });

  await prisma.concert.upsert({
    where: { id: CONCERT_IDS.justice },
    update: {},
    create: {
      id: CONCERT_IDS.justice,
      artistName: 'Justice',
      venueName: 'Halle Tony Garnier',
      city: 'Lyon',
      date: new Date('2025-03-14'),
      latitude: 45.7311,
      longitude: 4.8186,
      createdById: marco.id,
    },
  });

  await prisma.concert.upsert({
    where: { id: CONCERT_IDS.fontaines },
    update: {},
    create: {
      id: CONCERT_IDS.fontaines,
      artistName: 'Fontaines D.C.',
      venueName: 'Zénith de Paris',
      city: 'Paris',
      date: new Date('2025-02-20'),
      latitude: 48.8942,
      longitude: 2.3932,
      createdById: nina.id,
    },
  });

  // Concerts à venir : la carte et la section « Autour de toi » n'affichent
  // que le futur, donc leurs dates sont recalculées à chaque seed pour ne
  // jamais retomber dans le passé.
  await prisma.concert.upsert({
    where: { id: CONCERT_IDS.cure },
    update: { date: daysFromNow(21) },
    create: {
      id: CONCERT_IDS.cure,
      artistName: 'The Cure',
      venueName: 'AccorHotels Arena',
      city: 'Paris',
      date: daysFromNow(21),
      latitude: 48.8384,
      longitude: 2.3781,
      createdById: lea.id,
    },
  });

  await prisma.concert.upsert({
    where: { id: CONCERT_IDS.air },
    update: { date: daysFromNow(35) },
    create: {
      id: CONCERT_IDS.air,
      artistName: 'Air',
      venueName: 'Théâtre antique de Fourvière',
      city: 'Lyon',
      date: daysFromNow(35),
      latitude: 45.7601,
      longitude: 4.8197,
      createdById: marco.id,
    },
  });

  // Fil d'actualité : mélange de posts automatiques (note, présence) et de
  // posts explicites (texte), étalés sur les derniers jours.
  await seedPost({
    id: '00000000-0000-0000-0000-000000000101',
    type: 'RATING',
    authorId: lea.id,
    concertId: CONCERT_IDS.radiohead,
    ratingValue: 5,
    createdDaysAgo: 1,
  });
  await seedPost({
    id: '00000000-0000-0000-0000-000000000102',
    type: 'PHOTO',
    authorId: nina.id,
    concertId: CONCERT_IDS.fontaines,
    content:
      'Le mur de son sur "I Love You" hier soir… je crois que mes oreilles sifflent encore. Merci Paris.',
    createdDaysAgo: 2,
  });
  await seedPost({
    id: '00000000-0000-0000-0000-000000000103',
    type: 'ATTENDANCE',
    authorId: marco.id,
    concertId: CONCERT_IDS.justice,
    createdDaysAgo: 3,
  });
  await seedPost({
    id: '00000000-0000-0000-0000-000000000104',
    type: 'PHOTO',
    authorId: lea.id,
    content:
      'Question sérieuse : quel est le meilleur concert que vous ayez vu cette année ? Je fais ma liste de fin d’année.',
    createdDaysAgo: 4,
  });
  await seedPost({
    id: '00000000-0000-0000-0000-000000000105',
    type: 'RATING',
    authorId: marco.id,
    concertId: CONCERT_IDS.muse,
    ratingValue: 4,
    createdDaysAgo: 5,
  });
  await seedPost({
    id: '00000000-0000-0000-0000-000000000106',
    type: 'ATTENDANCE',
    authorId: nina.id,
    concertId: CONCERT_IDS.radiohead,
    createdDaysAgo: 6,
  });
  await seedPost({
    id: '00000000-0000-0000-0000-000000000107',
    type: 'PHOTO',
    authorId: demo2.id,
    concertId: CONCERT_IDS.justice,
    content:
      'La Halle Tony Garnier transformée en boîte de nuit géante. Setlist parfaite du début à la fin.',
    createdDaysAgo: 7,
  });

  // Quelques likes croisés pour que les compteurs ne soient pas tous à zéro.
  const likes: Array<{ userId: string; postId: string }> = [
    { userId: marco.id, postId: '00000000-0000-0000-0000-000000000101' },
    { userId: nina.id, postId: '00000000-0000-0000-0000-000000000101' },
    { userId: lea.id, postId: '00000000-0000-0000-0000-000000000102' },
    { userId: demo.id, postId: '00000000-0000-0000-0000-000000000102' },
    { userId: lea.id, postId: '00000000-0000-0000-0000-000000000103' },
    { userId: nina.id, postId: '00000000-0000-0000-0000-000000000104' },
  ];
  for (const like of likes) {
    await prisma.like.upsert({
      where: { userId_postId: like },
      update: {},
      create: like,
    });
  }

  // Commentaires sur la page du concert Radiohead (US-2.4).
  await prisma.comment.upsert({
    where: { id: '00000000-0000-0000-0000-000000000201' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000201',
      concertId: CONCERT_IDS.radiohead,
      userId: lea.id,
      content: 'Ils ont ouvert sur "Let Down", je ne m’en suis pas remise.',
      createdAt: daysAgo(1),
    },
  });
  await prisma.comment.upsert({
    where: { id: '00000000-0000-0000-0000-000000000202' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000202',
      concertId: CONCERT_IDS.radiohead,
      userId: marco.id,
      content: 'Le son de The O2 est incroyable, même tout en haut.',
      createdAt: daysAgo(1),
    },
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
