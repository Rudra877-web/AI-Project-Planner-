import type { User } from '../entities/User';
import type { Project } from '../entities/Project';

/**
 * Request augmentation.
 *
 * `user` is populated by middleware/auth.ts on authenticated routes, and
 * `project` by middleware/ownership.ts — which only ever loads a project that
 * belongs to `user`, so any handler that sees `req.project` can trust it.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
      project?: Project;
    }
  }
}

export {};
