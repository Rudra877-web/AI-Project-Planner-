import type { Request, Response } from 'express';
import { AppDataSource } from '../db/data-source';
import { DatabaseTable } from '../entities/DatabaseTable';
import { DatabaseField } from '../entities/DatabaseField';
import { currentProject } from '../middleware/ownership';
import { param } from '../utils/params';
import { NotFoundError } from '../utils/errors';

const tables = () => AppDataSource.getRepository(DatabaseTable);
const repo = () => AppDataSource.getRepository(DatabaseField);

/** Every handler here is nested under a project *and* a table, so both have to check out. */
async function loadTable(req: Request): Promise<DatabaseTable> {
  const project = currentProject(req);
  const table = await tables().findOne({ where: { id: param(req, 'tableId'), projectId: project.id } });
  if (!table) throw new NotFoundError('Table not found');
  return table;
}

export async function list(req: Request, res: Response) {
  const table = await loadTable(req);
  const rows = await repo().find({ where: { tableId: table.id }, order: { position: 'ASC' } });
  res.json({ fields: rows });
}

export async function create(req: Request, res: Response) {
  const table = await loadTable(req);
  const count = await repo().count({ where: { tableId: table.id } });
  const row = repo().create({ ...req.body, position: count, tableId: table.id });
  await repo().save(row);
  res.status(201).json({ field: row });
}

export async function update(req: Request, res: Response) {
  const table = await loadTable(req);
  const row = await repo().findOne({ where: { id: param(req, 'id'), tableId: table.id } });
  if (!row) throw new NotFoundError('Field not found');
  Object.assign(row, req.body);
  await repo().save(row);
  res.json({ field: row });
}

export async function remove(req: Request, res: Response) {
  const table = await loadTable(req);
  const row = await repo().findOne({ where: { id: param(req, 'id'), tableId: table.id } });
  if (!row) throw new NotFoundError('Field not found');
  await repo().remove(row);
  res.status(204).send();
}
