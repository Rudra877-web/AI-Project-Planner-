import type { Request, Response } from 'express';
import { AppDataSource } from '../db/data-source';
import { ProjectRequirement } from '../entities/ProjectRequirement';
import { currentProject } from '../middleware/ownership';
import { param } from '../utils/params';
import { NotFoundError } from '../utils/errors';

const repo = () => AppDataSource.getRepository(ProjectRequirement);

export async function list(req: Request, res: Response) {
  const project = currentProject(req);
  const rows = await repo().find({ where: { projectId: project.id }, order: { type: 'ASC', position: 'ASC' } });
  res.json({ requirements: rows });
}

export async function create(req: Request, res: Response) {
  const project = currentProject(req);
  const count = await repo().count({ where: { projectId: project.id, type: req.body.type } });
  const row = repo().create({ ...req.body, position: req.body.position ?? count, projectId: project.id });
  await repo().save(row);
  res.status(201).json({ requirement: row });
}

export async function update(req: Request, res: Response) {
  const project = currentProject(req);
  const row = await repo().findOne({ where: { id: param(req, 'id'), projectId: project.id } });
  if (!row) throw new NotFoundError('Requirement not found');
  Object.assign(row, req.body);
  await repo().save(row);
  res.json({ requirement: row });
}

export async function remove(req: Request, res: Response) {
  const project = currentProject(req);
  const row = await repo().findOne({ where: { id: param(req, 'id'), projectId: project.id } });
  if (!row) throw new NotFoundError('Requirement not found');
  await repo().remove(row);
  res.status(204).send();
}
