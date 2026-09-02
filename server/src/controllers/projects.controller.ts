import type { Request, Response } from 'express';
import { AppDataSource } from '../db/data-source';
import { Project } from '../entities/Project';
import { Task } from '../entities/Task';
import { ProjectPhase } from '../entities/ProjectPhase';
import { Page } from '../entities/Page';
import { ApiEndpoint } from '../entities/ApiEndpoint';
import { ProjectTechnology } from '../entities/ProjectTechnology';
import { DatabaseTable } from '../entities/DatabaseTable';
import { TestCase } from '../entities/TestCase';
import { Notification } from '../entities/Notification';
import { currentUser } from '../middleware/auth';
import { currentProject } from '../middleware/ownership';
import { generatePlan } from '../services/ai/provider';
import { persistGeneratedPlan } from '../services/planPersistence';
import { generateReadme } from '../services/readme';
import { phaseProgress, taskProgress, velocitySeries } from '../services/analytics';
import { BadRequestError } from '../utils/errors';
import type { GeneratePlanInput } from '../validators/project.validators';

const projects = () => AppDataSource.getRepository(Project);
const tasksRepo = () => AppDataSource.getRepository(Task);
const notifications = () => AppDataSource.getRepository(Notification);

/** §5 — turn the wizard's inputs into a full plan and persist it. */
export async function generate(req: Request, res: Response) {
  const user = currentUser(req);
  const body = req.body as GeneratePlanInput;

  const { result: plan, generatedWith } = await generatePlan({
    idea: body.idea,
    projectType: body.projectType,
    experienceLevel: body.experienceLevel,
    technologies: body.technologies,
    letAiChooseStack: body.letAiChooseStack,
  });

  const project = await persistGeneratedPlan(user, body, plan, generatedWith);

  await notifications().save(
    notifications().create({
      title: 'Your plan is ready',
      body: `${project.name} has been generated with ${plan.phases.length} phases and ${plan.tables.length} tables.`,
      type: 'success',
      link: `/projects/${project.id}`,
      userId: user.id,
      projectId: project.id,
    }),
  );

  res.status(201).json({ project, generatedWith });
}

/** A blank project for someone who wants to skip the wizard and build by hand. */
export async function create(req: Request, res: Response) {
  const user = currentUser(req);
  const { name, description, type } = req.body as {
    name?: string;
    description?: string;
    type?: string;
  };

  if (!name || name.trim().length < 2) {
    throw new BadRequestError('Give the project a name.');
  }

  const project = projects().create({
    name: name.trim(),
    description: description?.trim() || 'No description yet.',
    idea: description?.trim() || name.trim(),
    type: (type as Project['type']) ?? 'web',
    status: 'planning',
    aiGenerated: false,
    userId: user.id,
  });
  await projects().save(project);

  res.status(201).json({ project });
}

export async function list(req: Request, res: Response) {
  const user = currentUser(req);
  const { status, search } = req.query as { status?: string; search?: string };

  const qb = projects()
    .createQueryBuilder('project')
    .leftJoinAndSelect('project.tasks', 'task')
    .where('project.userId = :userId', { userId: user.id })
    .orderBy('project.updatedAt', 'DESC');

  if (status) qb.andWhere('project.status = :status', { status });
  if (search) qb.andWhere('LOWER(project.name) LIKE :search', { search: `%${search.toLowerCase()}%` });

  const rows = await qb.getMany();

  const summaries = rows.map((project) => ({
    ...project,
    tasks: undefined,
    progress: taskProgress(project.tasks ?? []),
  }));

  res.json({ projects: summaries });
}

export async function get(req: Request, res: Response) {
  const project = currentProject(req);

  const [technologies, pages, tables, endpoints, tasks, phases, tests] = await Promise.all([
    AppDataSource.getRepository(ProjectTechnology).find({ where: { projectId: project.id }, order: { position: 'ASC' } }),
    AppDataSource.getRepository(Page).find({ where: { projectId: project.id }, order: { position: 'ASC' } }),
    AppDataSource.getRepository(DatabaseTable).find({
      where: { projectId: project.id },
      relations: { fields: true },
      order: { position: 'ASC' },
    }),
    AppDataSource.getRepository(ApiEndpoint).find({ where: { projectId: project.id }, order: { position: 'ASC' } }),
    tasksRepo().find({ where: { projectId: project.id } }),
    AppDataSource.getRepository(ProjectPhase).find({
      where: { projectId: project.id },
      relations: { tasks: true },
      order: { orderIndex: 'ASC' },
    }),
    AppDataSource.getRepository(TestCase).find({ where: { projectId: project.id }, order: { position: 'ASC' } }),
  ]);

  res.json({
    project,
    technologies,
    pages,
    tables,
    endpoints,
    tests,
    progress: taskProgress(tasks),
    phases: phaseProgress(phases),
  });
}

export async function update(req: Request, res: Response) {
  const project = currentProject(req);
  const patch = req.body as Partial<Pick<Project, 'name' | 'description' | 'status'>>;

  Object.assign(project, patch);
  await projects().save(project);

  res.json({ project });
}

export async function remove(req: Request, res: Response) {
  const project = currentProject(req);
  await projects().remove(project);
  res.status(204).send();
}

export async function readme(req: Request, res: Response) {
  const project = currentProject(req);

  const [technologies, pages, endpoints, phases] = await Promise.all([
    AppDataSource.getRepository(ProjectTechnology).find({ where: { projectId: project.id } }),
    AppDataSource.getRepository(Page).find({ where: { projectId: project.id }, order: { position: 'ASC' } }),
    AppDataSource.getRepository(ApiEndpoint).find({ where: { projectId: project.id }, order: { position: 'ASC' } }),
    AppDataSource.getRepository(ProjectPhase).find({ where: { projectId: project.id }, order: { orderIndex: 'ASC' } }),
  ]);

  const markdown = generateReadme({ project, technologies, pages, endpoints, phases });
  project.readme = markdown;
  await projects().save(project);

  res.json({ readme: markdown });
}

export async function analytics(req: Request, res: Response) {
  const project = currentProject(req);
  const tasks = await tasksRepo().find({ where: { projectId: project.id } });
  const phases = await AppDataSource.getRepository(ProjectPhase).find({
    where: { projectId: project.id },
    relations: { tasks: true },
    order: { orderIndex: 'ASC' },
  });

  res.json({
    progress: taskProgress(tasks),
    phases: phaseProgress(phases),
    velocity: velocitySeries(tasks),
  });
}
