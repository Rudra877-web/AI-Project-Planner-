import type { Request, Response } from 'express';
import { AppDataSource } from '../db/data-source';
import { TestCase } from '../entities/TestCase';
import { currentProject } from '../middleware/ownership';
import { testSummary } from '../services/analytics';
import { param } from '../utils/params';
import { NotFoundError } from '../utils/errors';

const repo = () => AppDataSource.getRepository(TestCase);

export async function list(req: Request, res: Response) {
  const project = currentProject(req);
  const rows = await repo().find({ where: { projectId: project.id }, order: { category: 'ASC', position: 'ASC' } });
  res.json({ tests: rows, summary: testSummary(rows) });
}

export async function create(req: Request, res: Response) {
  const project = currentProject(req);
  const count = await repo().count({ where: { projectId: project.id } });
  const row = repo().create({ ...req.body, position: count, projectId: project.id });
  await repo().save(row);
  res.status(201).json({ test: row });
}

export async function update(req: Request, res: Response) {
  const project = currentProject(req);
  const row = await repo().findOne({ where: { id: param(req, 'id'), projectId: project.id } });
  if (!row) throw new NotFoundError('Test case not found');

  Object.assign(row, req.body);
  if (req.body.status && req.body.status !== 'not_tested') row.lastRunAt = new Date();

  await repo().save(row);
  res.json({ test: row });
}

export async function remove(req: Request, res: Response) {
  const project = currentProject(req);
  const row = await repo().findOne({ where: { id: param(req, 'id'), projectId: project.id } });
  if (!row) throw new NotFoundError('Test case not found');
  await repo().remove(row);
  res.status(204).send();
}
