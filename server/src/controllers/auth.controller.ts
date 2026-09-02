import type { Request, Response } from 'express';
import { AppDataSource } from '../db/data-source';
import { User } from '../entities/User';
import { env } from '../config/env';
import { currentUser } from '../middleware/auth';
import { publicUser } from '../serializers/user.serializer';
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from '../utils/errors';
import { clearAuthCookie, setAuthCookie, signToken } from '../utils/jwt';
import {
  createResetToken,
  hashPassword,
  hashResetToken,
  verifyPassword,
} from '../utils/password';

const users = () => AppDataSource.getRepository(User);

/**
 * A valid bcrypt hash to compare against when the email doesn't exist.
 *
 * Without it, a missing account returns in ~1ms while a real one takes the full
 * bcrypt cost, which is a usable account-enumeration oracle. Computed once,
 * lazily, so it never slows down boot.
 */
let decoyHash: string | null = null;
async function getDecoyHash(): Promise<string> {
  decoyHash ??= await hashPassword('buildflow-timing-equaliser');
  return decoyHash;
}

function issueSession(res: Response, user: User) {
  const token = signToken({ sub: user.id, email: user.email });
  setAuthCookie(res, token);
}

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body as {
    name: string;
    email: string;
    password: string;
  };

  const existing = await users().findOne({ where: { email } });
  if (existing) {
    throw new ConflictError('An account with that email already exists.');
  }

  const user = users().create({
    name,
    email,
    passwordHash: await hashPassword(password),
  });

  await users().save(user);
  issueSession(res, user);

  res.status(201).json({ user: publicUser(user) });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };

  // passwordHash is `select: false`, so ask for it explicitly.
  const user = await users()
    .createQueryBuilder('user')
    .addSelect('user.passwordHash')
    .where('user.email = :email', { email })
    .getOne();

  const hash = user?.passwordHash ?? (await getDecoyHash());
  const ok = await verifyPassword(password, hash);

  // One message for both "no such account" and "wrong password".
  if (!user || !ok) {
    throw new UnauthorizedError('That email and password combination is incorrect.');
  }

  issueSession(res, user);
  res.json({ user: publicUser(user) });
}

export async function logout(_req: Request, res: Response) {
  clearAuthCookie(res);
  res.json({ ok: true });
}

export async function me(req: Request, res: Response) {
  res.json({ user: publicUser(currentUser(req)) });
}

/**
 * §3 forgot password.
 *
 * Always reports success, whether or not the address is registered — a
 * different response for unknown emails would turn this into an account
 * enumeration endpoint.
 *
 * No mail provider is configured in this build, so the link is returned in the
 * response outside production and logged to the server console. That is stated
 * plainly in the README rather than pretending an email was sent.
 */
export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body as { email: string };
  const user = await users().findOne({ where: { email } });

  let resetUrl: string | undefined;

  if (user) {
    const { token, hash, expiresAt } = createResetToken();
    user.resetTokenHash = hash;
    user.resetTokenExpiresAt = expiresAt;
    await users().save(user);

    resetUrl = `${env.CLIENT_URL.split(',')[0]}/reset-password?token=${token}`;
    console.log(`[auth] password reset requested for ${email}\n       ${resetUrl}`);
  }

  res.json({
    ok: true,
    message:
      'If an account exists for that address, a password reset link is on its way.',
    // Development convenience only — never exposed in production.
    ...(!env.isProduction && resetUrl ? { resetUrl } : {}),
  });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body as { token: string; password: string };

  const user = await users()
    .createQueryBuilder('user')
    .addSelect(['user.resetTokenHash', 'user.resetTokenExpiresAt'])
    .where('user.resetTokenHash = :hash', { hash: hashResetToken(token) })
    .andWhere('user.resetTokenExpiresAt > :now', { now: new Date() })
    .getOne();

  if (!user) {
    throw new BadRequestError('That reset link is invalid or has expired.');
  }

  user.passwordHash = await hashPassword(password);
  user.resetTokenHash = null;
  user.resetTokenExpiresAt = null;
  await users().save(user);

  // Sign them straight in — they have just proven control of the address.
  issueSession(res, user);
  res.json({ ok: true, user: publicUser(user) });
}

export async function updateProfile(req: Request, res: Response) {
  const user = currentUser(req);
  const { name, jobTitle, avatarUrl } = req.body as {
    name?: string;
    jobTitle?: string;
    avatarUrl?: string;
  };

  if (name !== undefined) user.name = name;
  if (jobTitle !== undefined) user.jobTitle = jobTitle || null;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl || null;

  await users().save(user);
  res.json({ user: publicUser(user) });
}

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, password } = req.body as {
    currentPassword: string;
    password: string;
  };

  const user = await users()
    .createQueryBuilder('user')
    .addSelect('user.passwordHash')
    .where('user.id = :id', { id: currentUser(req).id })
    .getOne();

  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new UnauthorizedError('Your current password is incorrect.');
  }

  user.passwordHash = await hashPassword(password);
  await users().save(user);

  // Re-issue so the existing cookie isn't left representing the old credential.
  issueSession(res, user);
  res.json({ ok: true });
}
