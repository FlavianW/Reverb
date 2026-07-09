import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Profil minimal renvoyé par Google après une authentification OAuth réussie. */
export interface GoogleProfile {
  googleId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

/** Représentation d'un utilisateur exposable au client (sans googleId ni dates internes). */
export interface PublicUser {
  id: string;
  pseudo: string;
  email: string;
  avatarUrl: string | null;
}

/** Ne garde que les champs d'un `User` destinés à être exposés hors de l'API. */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    pseudo: user.pseudo,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };
}

/**
 * Gère les comptes utilisateur. Aucune création manuelle : un compte naît
 * uniquement de la première connexion OAuth Google (US-1.1), il n'y a pas
 * de mot de passe local à gérer.
 */
@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { googleId } });
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
