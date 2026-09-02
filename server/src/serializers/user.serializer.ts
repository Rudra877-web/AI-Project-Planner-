import type { User } from '../entities/User';

/** Fields that are safe to send to the browser. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  createdAt: Date;
}

/**
 * Explicit allow-list rather than deleting sensitive keys.
 *
 * `passwordHash` and the reset-token columns are `select: false`, so a `findOne`
 * never loads them — but a freshly `save()`d entity still holds them in memory,
 * and that is exactly the object a register handler is tempted to return. An
 * allow-list means adding a sensitive column later cannot silently start
 * leaking it.
 */
export function publicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    jobTitle: user.jobTitle ?? null,
    createdAt: user.createdAt,
  };
}
