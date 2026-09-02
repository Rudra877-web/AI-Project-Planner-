import type { Request, Response } from 'express';
import { AppDataSource } from '../db/data-source';
import { ProjectChange } from '../entities/ProjectChange';
import { DatabaseTable } from '../entities/DatabaseTable';
import { Page } from '../entities/Page';
import { ApiEndpoint } from '../entities/ApiEndpoint';
import { Notification } from '../entities/Notification';
import { currentProject } from '../middleware/ownership';
import { currentUser } from '../middleware/auth';
import { analyzeChangeRequest } from '../services/ai/provider';
import { applyImpactAnalysis } from '../services/changeApply';
import { param } from '../utils/params';
import { BadRequestError, NotFoundError } from '../utils/errors';

const repo = () => AppDataSource.getRepository(ProjectChange);
const notifications = () => AppDataSource.getRepository(Notification);

export async function list(req: Request, res: Response) {
  const project = currentProject(req);
  const rows = await repo().find({ where: { projectId: project.id }, order: { createdAt: 'DESC' } });
  res.json({ changes: rows });
}

export async function analyze(req: Request, res: Response) {
  const project = currentProject(req);
  const { request } = req.body as { request: string };

  // Load the project's current shape so the analyzer (Claude or offline)
  // reasons about what already exists rather than guessing.
  const [tables, pages, endpoints] = await Promise.all([
    AppDataSource.getRepository(DatabaseTable).find({ where: { projectId: project.id } }),
    AppDataSource.getRepository(Page).find({ where: { projectId: project.id } }),
    AppDataSource.getRepository(ApiEndpoint).find({ where: { projectId: project.id } }),
  ]);
  project.databaseTables = tables;
  project.pages = pages;
  project.apiEndpoints = endpoints;

  const { result: impact, generatedWith } = await analyzeChangeRequest(request, project);

  const change = repo().create({
    request,
    title: request.slice(0, 80),
    status: 'pending',
    impact,
    generatedWith,
    projectId: project.id,
  });
  await repo().save(change);

  res.status(201).json({ change });
}

async function loadChange(req: Request): Promise<ProjectChange> {
  const project = currentProject(req);
  const change = await repo().findOne({ where: { id: param(req, 'id'), projectId: project.id } });
  if (!change) throw new NotFoundError('Change not found');
  return change;
}

export async function accept(req: Request, res: Response) {
  const project = currentProject(req);
  const user = currentUser(req);
  const change = await loadChange(req);

  if (change.status !== 'pending') {
    throw new BadRequestError('This change has already been resolved.');
  }
  if (!change.impact) {
    throw new BadRequestError('This change has no analysis to apply.');
  }

  const summary = await applyImpactAnalysis(project, change, change.impact);

  await notifications().save(
    notifications().create({
      title: 'Change applied',
      body: `"${change.title}" added ${summary.tablesCreated} table(s), ${summary.endpointsCreated} endpoint(s) and ${summary.tasksCreated} task(s).`,
      type: 'success',
      link: `/projects/${project.id}`,
      userId: user.id,
      projectId: project.id,
    }),
  );

  res.json({ change, summary });
}

export async function reject(req: Request, res: Response) {
  const change = await loadChange(req);
  if (change.status !== 'pending') {
    throw new BadRequestError('This change has already been resolved.');
  }
  change.status = 'rejected';
  change.resolvedAt = new Date();
  await repo().save(change);
  res.json({ change });
}
