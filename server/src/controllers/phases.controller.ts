import type { Request, Response } from 'express';
import { AppDataSource } from '../db/data-source';
import { ProjectPhase } from '../entities/ProjectPhase';
import { currentProject } from '../middleware/ownership';
import { phaseProgress } from '../services/analytics';
import { param } from '../utils/params';
import { NotFoundError } from '../utils/errors';

const repo = () => AppDataSource.getRepository(ProjectPhase);

export async function list(req: Request, res: Response) {
  const project = currentProject(req);
  const rows = await repo().find({
    where: { projectId: project.id },
    relations: { tasks: true },
    order: { orderIndex: 'ASC' },
  });
  res.json({ phases: phaseProgress(rows), raw: rows });
}

export async function create(req: Request, res: Response) {
  const project = currentProject(req);
  const count = await repo().count({ where: { projectId: project.id } });
  const row = repo().create({ ...req.body, orderIndex: req.body.orderIndex ?? count + 1, projectId: project.id });
  await repo().save(row);
  res.status(201).json({ phase: row });
}

export async function update(req: Request, res: Response) {
  const project = currentProject(req);
  const row = await repo().findOne({ where: { id: param(req, 'id'), projectId: project.id } });
  if (!row) throw new NotFoundError('Phase not found');
  Object.assign(row, req.body);
  await repo().save(row);
  res.json({ phase: row });
}

export async function remove(req: Request, res: Response) {
  const project = currentProject(req);
  const row = await repo().findOne({ where: { id: param(req, 'id'), projectId: project.id } });
  if (!row) throw new NotFoundError('Phase not found');
  await repo().remove(row);
  res.status(204).send();
}
