import type { Request, Response } from 'express';
import { AppDataSource } from '../db/data-source';
import { ApiEndpoint } from '../entities/ApiEndpoint';
import { currentProject } from '../middleware/ownership';
import { param } from '../utils/params';
import { NotFoundError } from '../utils/errors';

const repo = () => AppDataSource.getRepository(ApiEndpoint);

export async function list(req: Request, res: Response) {
  const project = currentProject(req);
  const rows = await repo().find({ where: { projectId: project.id }, order: { position: 'ASC' } });
  res.json({ endpoints: rows });
}

export async function create(req: Request, res: Response) {
  const project = currentProject(req);
  const count = await repo().count({ where: { projectId: project.id } });
  const row = repo().create({ ...req.body, position: count, projectId: project.id });
  await repo().save(row);
  res.status(201).json({ endpoint: row });
}

export async function update(req: Request, res: Response) {
  const project = currentProject(req);
  const row = await repo().findOne({ where: { id: param(req, 'id'), projectId: project.id } });
  if (!row) throw new NotFoundError('Endpoint not found');
  Object.assign(row, req.body);
  await repo().save(row);
  res.json({ endpoint: row });
}

export async function remove(req: Request, res: Response) {
  const project = currentProject(req);
  const row = await repo().findOne({ where: { id: param(req, 'id'), projectId: project.id } });
  if (!row) throw new NotFoundError('Endpoint not found');
  await repo().remove(row);
  res.status(204).send();
}
