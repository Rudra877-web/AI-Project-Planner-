import type { Request, Response } from 'express';
import { AppDataSource } from '../db/data-source';
import { ProjectTechnology } from '../entities/ProjectTechnology';
import { Technology } from '../entities/Technology';
import { currentProject } from '../middleware/ownership';
import { param, queryParam } from '../utils/params';
import { NotFoundError } from '../utils/errors';

const repo = () => AppDataSource.getRepository(ProjectTechnology);
const catalogRepo = () => AppDataSource.getRepository(Technology);

export async function list(req: Request, res: Response) {
  const project = currentProject(req);
  const rows = await repo().find({ where: { projectId: project.id }, order: { position: 'ASC' } });
  res.json({ technologies: rows });
}

export async function create(req: Request, res: Response) {
  const project = currentProject(req);
  const count = await repo().count({ where: { projectId: project.id } });
  const row = repo().create({ ...req.body, position: count, projectId: project.id });
  await repo().save(row);
  res.status(201).json({ technology: row });
}

export async function update(req: Request, res: Response) {
  const project = currentProject(req);
  const row = await repo().findOne({ where: { id: param(req, 'id'), projectId: project.id } });
  if (!row) throw new NotFoundError('Technology not found');
  Object.assign(row, req.body);
  await repo().save(row);
  res.json({ technology: row });
}

export async function remove(req: Request, res: Response) {
  const project = currentProject(req);
  const row = await repo().findOne({ where: { id: param(req, 'id'), projectId: project.id } });
  if (!row) throw new NotFoundError('Technology not found');
  await repo().remove(row);
  res.status(204).send();
}

/** Browse the shared catalogue — not project-scoped. Used by the stack picker. */
export async function catalog(req: Request, res: Response) {
  const category = queryParam(req, 'category');
  const rows = await catalogRepo().find({
    where: category ? { category: category as Technology['category'] } : {},
    order: { name: 'ASC' },
  });
  res.json({ technologies: rows });
}
