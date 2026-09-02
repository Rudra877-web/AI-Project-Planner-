import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { env } from '../config/env';
import { UnauthorizedError } from './errors';

export const AUTH_COOKIE = 'bf_session';

export interface TokenPayload {
  sub: string;
  email: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === 'string' || !decoded.sub) {
      throw new UnauthorizedError('Your session is invalid. Please sign in again.');
    }
    return { sub: String(decoded.sub), email: String((decoded as jwt.JwtPayload).email ?? '') };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Your session has expired. Please sign in again.');
    }
    throw new UnauthorizedError('Your session is invalid. Please sign in again.');
  }
}

/**
 * The session token lives in an httpOnly cookie rather than localStorage, so
 * client-side script — including anything injected via a dependency — cannot
 * read it (§24).
 *
 * `SameSite=Lax` is safe here because the API is same-origin with the app in
 * both dev (Vite proxies /api) and a standard single-origin deployment.
 */
export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/',
  });
}
