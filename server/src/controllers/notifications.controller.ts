import type { Request, Response } from 'express';
import { AppDataSource } from '../db/data-source';
import { Notification } from '../entities/Notification';
import { currentUser } from '../middleware/auth';
import { param } from '../utils/params';
import { NotFoundError } from '../utils/errors';

const repo = () => AppDataSource.getRepository(Notification);

export async function list(req: Request, res: Response) {
  const user = currentUser(req);
  const rows = await repo().find({ where: { userId: user.id }, order: { createdAt: 'DESC' }, take: 100 });
  const unread = rows.filter((n) => !n.isRead).length;
  res.json({ notifications: rows, unread });
}

export async function markRead(req: Request, res: Response) {
  const user = currentUser(req);
  const row = await repo().findOne({ where: { id: param(req, 'id'), userId: user.id } });
  if (!row) throw new NotFoundError('Notification not found');
  row.isRead = true;
  await repo().save(row);
  res.json({ notification: row });
}

export async function markAllRead(req: Request, res: Response) {
  const user = currentUser(req);
  await repo().update({ userId: user.id, isRead: false }, { isRead: true });
  res.json({ ok: true });
}

export async function remove(req: Request, res: Response) {
  const user = currentUser(req);
  const row = await repo().findOne({ where: { id: param(req, 'id'), userId: user.id } });
  if (!row) throw new NotFoundError('Notification not found');
  await repo().remove(row);
  res.status(204).send();
}
