import type { Request, Response } from 'express';
import { AppDataSource } from '../db/data-source';
import { Task } from '../entities/Task';
import { TaskDependency } from '../entities/TaskDependency';
import { Notification } from '../entities/Notification';
import { currentProject } from '../middleware/ownership';
import { currentUser } from '../middleware/auth';
import { getStuckGuidance } from '../services/ai/provider';
import { param } from '../utils/params';
import { BadRequestError, NotFoundError } from '../utils/errors';

const repo = () => AppDataSource.getRepository(Task);
const depsRepo = () => AppDataSource.getRepository(TaskDependency);
const notifications = () => AppDataSource.getRepository(Notification);

async function loadTask(req: Request): Promise<Task> {
  const project = currentProject(req);
  const task = await repo().findOne({
    where: { id: param(req, 'id'), projectId: project.id },
    relations: { phase: true, dependencies: true, dependents: true },
  });
  if (!task) throw new NotFoundError('Task not found');
  return task;
}

export async function list(req: Request, res: Response) {
  const project = currentProject(req);
  const rows = await repo().find({
    where: { projectId: project.id },
    relations: { dependencies: true },
    order: { boardPosition: 'ASC' },
  });
  res.json({ tasks: rows });
}

export async function create(req: Request, res: Response) {
  const project = currentProject(req);
  const count = await repo().count({ where: { projectId: project.id, status: req.body.status ?? 'todo' } });
  const row = repo().create({ ...req.body, boardPosition: count, projectId: project.id });
  await repo().save(row);
  res.status(201).json({ task: row });
}

export async function update(req: Request, res: Response) {
  const task = await loadTask(req);
  const wasCompleted = task.status === 'completed';

  Object.assign(task, req.body);
  // Title changes invalidate cached "I'm Stuck" guidance for the old wording.
  if (req.body.title) task.stuckGuidance = null;

  if (task.status === 'completed' && !wasCompleted) task.completedAt = new Date();
  if (task.status !== 'completed') task.completedAt = null;

  await repo().save(task);
  res.json({ task });
}

/** Drag-and-drop endpoint: only status + column position change, nothing else. */
export async function move(req: Request, res: Response) {
  const task = await loadTask(req);
  const { status, boardPosition } = req.body as { status: Task['status']; boardPosition: number };

  const wasCompleted = task.status === 'completed';
  task.status = status;
  task.boardPosition = boardPosition;
  if (status === 'completed' && !wasCompleted) task.completedAt = new Date();
  if (status !== 'completed') task.completedAt = null;

  await repo().save(task);
  res.json({ task });
}

export async function remove(req: Request, res: Response) {
  const task = await loadTask(req);
  await repo().remove(task);
  res.status(204).send();
}

export async function addDependency(req: Request, res: Response) {
  const project = currentProject(req);
  const task = await loadTask(req);
  const { dependsOnId } = req.body as { dependsOnId: string };

  if (dependsOnId === task.id) {
    throw new BadRequestError('A task cannot depend on itself.');
  }

  const dependsOn = await repo().findOne({ where: { id: dependsOnId, projectId: project.id } });
  if (!dependsOn) throw new NotFoundError('The task it should depend on was not found.');

  // Cheap cycle guard: the target cannot already (transitively, one level) depend on this task.
  const reverse = await depsRepo().findOne({ where: { taskId: dependsOnId, dependsOnId: task.id } });
  if (reverse) {
    throw new BadRequestError('That would create a circular dependency.');
  }

  const existing = await depsRepo().findOne({ where: { taskId: task.id, dependsOnId } });
  if (!existing) {
    await depsRepo().save(depsRepo().create({ taskId: task.id, dependsOnId }));
  }

  const dependencies = await depsRepo().find({ where: { taskId: task.id } });
  res.status(201).json({ dependencies });
}

export async function removeDependency(req: Request, res: Response) {
  const task = await loadTask(req);
  const dependsOnId = param(req, 'dependsOnId');
  const edge = await depsRepo().findOne({ where: { taskId: task.id, dependsOnId } });
  if (!edge) throw new NotFoundError('Dependency not found');
  await depsRepo().remove(edge);
  res.status(204).send();
}

/** §12 "I'm Stuck" — cached on the task until the title changes. */
export async function stuck(req: Request, res: Response) {
  const project = currentProject(req);
  const user = currentUser(req);
  const task = await loadTask(req);

  if (task.stuckGuidance) {
    res.json({ guidance: task.stuckGuidance, cached: true });
    return;
  }

  const { result, generatedWith } = await getStuckGuidance(task, project);
  task.stuckGuidance = result as unknown as Record<string, unknown>;
  await repo().save(task);

  await notifications().save(
    notifications().create({
      title: 'Guidance ready',
      body: `Help for "${task.title}" is ready.`,
      type: 'info',
      link: `/projects/${project.id}/tasks/${task.id}`,
      userId: user.id,
      projectId: project.id,
    }),
  );

  res.json({ guidance: result, generatedWith, cached: false });
}
