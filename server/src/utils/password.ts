import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { env } from '../config/env';

/** §24 — passwords are only ever stored as a bcrypt hash. */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Password-reset tokens: a long random value goes in the link, only its digest
 * is stored. A database read therefore cannot be turned into a reset.
 */
export function createResetToken(): { token: string; hash: string; expiresAt: Date } {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    hash: hashResetToken(token),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // one hour
  };
}

export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
