import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { AppDataSource } from '../db/data-source';
import { Project } from '../entities/Project';
import { NotFoundError } from '../utils/errors';
import { param } from '../utils/params';
import { currentUser } from './auth';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The single chokepoint for §3's "users should only be able to access their own
 * projects".
 *
 * Every project-scoped route mounts this, and the lookup is scoped by owner in
 * the same query as the id. There is deliberately no separate "does it exist?"
 * then "is it yours?" pair — one query means there is no window in which a
 * handler could act on someone else's row, and no code path where a future
 * contributor forgets the second check.
 *
 * A project owned by another user yields 404, not 403: a 403 would confirm the
 * id is real and leak the existence of other people's work.
 */
export const loadProject: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const user = currentUser(req);
  const projectId = param(req, 'projectId') ?? param(req, 'id');

  // Guard before querying. TypeORM 1.x throws on an `undefined` where-value,
  // and Postgres rejects a malformed uuid cast outright — both would surface as
  // a 500 for what is really "no such project".
  if (!projectId || !UUID_RE.test(projectId)) {
    throw new NotFoundError('Project not found');
  }

  const project = await AppDataSource.getRepository(Project).findOne({
    where: { id: projectId, userId: user.id },
  });

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  req.project = project;
  next();
};

/** Narrowing helper for handlers mounted behind `loadProject`. */
export function currentProject(req: Request): Project {
  if (!req.project) throw new NotFoundError('Project not found');
  return req.project;
}
