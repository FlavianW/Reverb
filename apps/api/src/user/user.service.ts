import { ConflictException, Injectable } from '@nestjs/common';
import { Concert, Prisma, User } from '@prisma/client';
import type { PublicUser } from '@reverb/shared';
import { PrismaService } from '../prisma/prisma.service';

/** Code Prisma d'une violation de contrainte unique (ex. email/pseudo déjà pris). */
const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

/** Profil minimal renvoyé par Google après une authentification OAuth réussie. */
export interface GoogleProfile {
  googleId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

/** Ne garde que les champs d'un `User` destinés à être exposés hors de l'API. */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    pseudo: user.pseudo,
    email: user.email,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
  };
}

/**
 * Profil consultable par n'importe quel visiteur (US-4.1, US-4.2) : ni email
 * ni id, contrairement à `PublicUser` qui est réservé au propriétaire du compte.
 */
export interface PublicProfile {
  pseudo: string;
  bio: string | null;
  avatarUrl: string | null;
  attendedConcerts: Concert[];
}

/**
 * Gère les comptes utilisateur. Un compte naît soit de la première connexion
 * OAuth Google (US-1.1), soit d'une inscription email/mot de passe (US-1.1 bis).
 */
@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByPseudo(pseudo: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { pseudo } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async createWithPassword(input: {
    email: string;
    pseudo: string;
    passwordHash: string;
  }): Promise<User> {
    try {
      return await this.prisma.user.create({ data: input });
    } catch (error) {
      throw this.toConflictIfUniqueViolation(error);
    }
  }

  /** Met à jour les champs de profil fournis (US-4.1). */
  async updateProfile(
    userId: string,
    data: { pseudo?: string; bio?: string; avatarUrl?: string },
  ): Promise<User> {
    try {
      return await this.prisma.user.update({ where: { id: userId }, data });
    } catch (error) {
      throw this.toConflictIfUniqueViolation(error);
    }
  }

  /**
   * Les contrôleurs vérifient déjà l'unicité de l'email/pseudo avant d'appeler
   * ces méthodes, mais ce filet couvre la fenêtre de course entre la
   * vérification et l'écriture (deux requêtes concurrentes).
   */
  private toConflictIfUniqueViolation(error: unknown): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === UNIQUE_CONSTRAINT_VIOLATION
    ) {
      return new ConflictException(
        'Cette adresse e-mail ou ce pseudo est déjà utilisé.',
      );
    }
    return error;
  }

  /** Concerts marqués « J'y étais » par cet utilisateur, du plus récent au plus ancien (US-4.2). */
  async findAttendedConcerts(userId: string): Promise<Concert[]> {
    const attendances = await this.prisma.concertAttendance.findMany({
      where: { userId },
      include: { concert: true },
      orderBy: { concert: { date: 'desc' } },
    });
    return attendances.map((attendance) => attendance.concert);
  }

  /**
   * Retourne le compte existant pour ce profil Google, ou le crée s'il s'agit
   * de la première connexion. Le pseudo est dérivé du nom Google et rendu
   * unique en cas de collision avec un pseudo déjà pris.
   */
  async findOrCreateFromGoogleProfile(profile: GoogleProfile): Promise<User> {
    const existing = await this.findByGoogleId(profile.googleId);
    if (existing) {
      return existing;
    }

    const pseudo = await this.generateUniquePseudo(profile.displayName);

    return this.prisma.user.create({
      data: {
        googleId: profile.googleId,
        email: profile.email,
        pseudo,
        avatarUrl: profile.avatarUrl,
      },
    });
  }

  private async generateUniquePseudo(displayName: string): Promise<string> {
    const base = slugify(displayName);
    let pseudo = base;
    let suffix = 1;

    while (await this.prisma.user.findUnique({ where: { pseudo } })) {
      suffix += 1;
      pseudo = `${base}-${suffix}`;
    }

    return pseudo;
  }
}

const COMBINING_DIACRITIC_RANGE = { min: 768, max: 879 }; // U+0300–U+036F

/**
 * `normalize('NFD')` décompose les lettres accentuées en lettre de base +
 * diacritique (ex. "é" → "e" + accent U+0301) ; cette fonction retire ensuite
 * ces diacritiques par code point, sans dépendre d'une regex Unicode.
 */
function stripDiacritics(value: string): string {
  return Array.from(value)
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return (
        code < COMBINING_DIACRITIC_RANGE.min ||
        code > COMBINING_DIACRITIC_RANGE.max
      );
    })
    .join('');
}

function slugify(value: string): string {
  const slug = stripDiacritics(value.normalize('NFD'))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');

  return slug || 'utilisateur';
}
