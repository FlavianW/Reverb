import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';

const SALT_ROUNDS = 12;

/** Encapsule le hachage bcrypt des mots de passe (US-1.1 bis, US-1.2 bis). */
@Injectable()
export class PasswordService {
  hashPassword(plainPassword: string): Promise<string> {
    return hash(plainPassword, SALT_ROUNDS);
  }

  verifyPassword(
    plainPassword: string,
    passwordHash: string,
  ): Promise<boolean> {
    return compare(plainPassword, passwordHash);
  }
}
