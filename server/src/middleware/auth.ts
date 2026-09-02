import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { AppDataSource } from '../db/data-source';
import { User } from '../entities/User';
import { UnauthorizedError } from '../utils/errors';
import { AUTH_COOKIE, verifyToken } from '../utils/jwt';

/**
 * Resolves the session cookie into a real user row.
 *
 * The lookup is not skipped in favour of trusting the JWT claims: a token can
 * outlive the account it names, and every downstream ownership check keys off
 * `req.user.id`, so it has to correspond to a user that still exists.
 */
export const requireAuth: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token || typeof token !== 'string') {
    throw new UnauthorizedError();
  }

  const payload = verifyToken(token);

  const user = await AppDataSource.getRepository(User).findOne({
    where: { id: payload.sub },
  });

  if (!user) {
    throw new UnauthorizedError('That account no longer exists.');
  }

  req.user = user;
  next();
};

/**
 * Populates `req.user` when a valid session exists but never rejects. Used by
 * routes that behave differently for signed-in visitors without requiring it.
 */
export const optionalAuth: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token || typeof token !== 'string') return next();

  try {
    const payload = verifyToken(token);
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: payload.sub },
    });
    if (user) req.user = user;
  } catch {
    // An invalid token is simply "not signed in" on an optional route.
  }

  next();
};

/** Narrowing helper for handlers that run behind `requireAuth`. */
export function currentUser(req: Request): User {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}
