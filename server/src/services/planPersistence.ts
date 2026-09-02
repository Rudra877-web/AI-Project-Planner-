import type { EntityManager } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import { Project } from '../entities/Project';
import { ProjectRequirement } from '../entities/ProjectRequirement';
import { ProjectTechnology } from '../entities/ProjectTechnology';
import { Page } from '../entities/Page';
import { DatabaseTable } from '../entities/DatabaseTable';
import { DatabaseField } from '../entities/DatabaseField';
import { ApiEndpoint } from '../entities/ApiEndpoint';
import { ProjectPhase } from '../entities/ProjectPhase';
import { Task } from '../entities/Task';
import { TaskDependency } from '../entities/TaskDependency';
import { TestCase } from '../entities/TestCase';
import { Technology } from '../entities/Technology';
import type { User } from '../entities/User';
import type { GeneratedPlan } from '../types/plan';
import type { PlanRequest } from '../types/plan';

/**
 * Writes a freshly generated plan into every project-scoped table in one
 * transaction — either the whole plan lands, or none of it does. Splitting
 * this across separate `save()` calls outside a transaction would risk a
 * project with tables but no pages if the process died halfway through.
 */
export async function persistGeneratedPlan(
  user: User,
  request: PlanRequest,
  plan: GeneratedPlan,
  generatedWith: 'claude' | 'offline',
): Promise<Project> {
  return AppDataSource.transaction(async (manager: EntityManager) => {
    const project = manager.create(Project, {
      name: plan.name,
      description: plan.description.slice(0, 399),
      idea: request.idea,
      type: request.projectType,
      status: 'planning',
      experienceLevel: request.experienceLevel,
      problemStatement: plan.problemStatement,
      targetUsers: plan.targetUsers,
      goals: plan.goals,
      architecture: plan.architecture,
      deployment: plan.deployment,
      domain: plan.domain,
      aiGenerated: true,
      generatedWith,
      userId: user.id,
    });
    await manager.save(project);

    // ── Requirements: goals, target users, core & future features ──────────
    const requirements: ProjectRequirement[] = [];
    plan.goals.forEach((g, i) =>
      requirements.push(
        manager.create(ProjectRequirement, { type: 'goal', title: g, position: i, projectId: project.id }),
      ),
    );
    plan.targetUsers.forEach((u, i) =>
      requirements.push(
        manager.create(ProjectRequirement, {
          type: 'target_user',
          title: u,
          position: i,
          projectId: project.id,
        }),
      ),
    );
    plan.coreFeatures.forEach((f, i) =>
      requirements.push(
        manager.create(ProjectRequirement, {
          type: 'core_feature',
          title: f.title,
          description: f.description,
          position: i,
          projectId: project.id,
        }),
      ),
    );
    plan.futureFeatures.forEach((f, i) =>
      requirements.push(
        manager.create(ProjectRequirement, {
          type: 'future_feature',
          title: f.title,
          description: f.description,
          position: i,
          projectId: project.id,
        }),
      ),
    );
    if (requirements.length) await manager.save(requirements);

    // ── Tech stack ───────────────────────────────────────────────────────────
    const catalog = await manager.find(Technology);
    const technologies = plan.stack.map((t, i) =>
      manager.create(ProjectTechnology, {
        name: t.name,
        category: t.category,
        rationale: t.rationale,
        alternatives: t.alternatives,
        advantages: t.advantages,
        disadvantages: t.disadvantages,
        aiRecommended: request.letAiChooseStack,
        position: i,
        projectId: project.id,
        technologyId: catalog.find((c) => c.name.toLowerCase() === t.name.toLowerCase())?.id ?? null,
      }),
    );
    if (technologies.length) await manager.save(technologies);

    // ── Pages ────────────────────────────────────────────────────────────────
    const pages = plan.pages.map((p, i) =>
      manager.create(Page, {
        name: p.name,
        route: p.route,
        purpose: p.purpose,
        components: p.components,
        userActions: p.userActions,
        apis: p.apis,
        entities: p.entities,
        isProtected: p.isProtected ?? false,
        isAdmin: p.isAdmin ?? false,
        position: i,
        projectId: project.id,
      }),
    );
    if (pages.length) await manager.save(pages);

    // ── Database tables & fields ────────────────────────────────────────────
    const tables = plan.tables.map((t, i) =>
      manager.create(DatabaseTable, {
        name: t.name,
        description: t.description,
        positionX: (i % 4) * 280,
        positionY: Math.floor(i / 4) * 260,
        position: i,
        projectId: project.id,
      }),
    );
    if (tables.length) await manager.save(tables);

    const fields: DatabaseField[] = [];
    plan.tables.forEach((t, ti) => {
      const savedTable = tables[ti];
      t.fields.forEach((f, fi) =>
        fields.push(
          manager.create(DatabaseField, {
            name: f.name,
            dataType: f.dataType,
            isPrimary: f.isPrimary ?? false,
            isForeign: f.isForeign ?? false,
            isNullable: f.isNullable ?? true,
            isUnique: f.isUnique ?? false,
            defaultValue: f.defaultValue ?? null,
            description: f.description ?? null,
            referencesTable: f.referencesTable ?? null,
            referencesField: f.referencesField ?? null,
            position: fi,
            tableId: savedTable.id,
          }),
        ),
      );
    });
    if (fields.length) await manager.save(fields);

    // ── API endpoints ────────────────────────────────────────────────────────
    const endpoints = plan.endpoints.map((e, i) =>
      manager.create(ApiEndpoint, {
        method: e.method,
        path: e.path,
        description: e.description,
        group: e.group,
        requiresAuth: e.requiresAuth,
        requestBody: e.requestBody ?? null,
        parameters: e.parameters ?? null,
        responseExample: e.responseExample ?? null,
        successStatus: e.successStatus ?? 200,
        relatedTables: e.relatedTables,
        position: i,
        projectId: project.id,
      }),
    );
    if (endpoints.length) await manager.save(endpoints);

    // ── Phases, tasks & dependencies ────────────────────────────────────────
    const phases = plan.phases.map((p) =>
      manager.create(ProjectPhase, {
        name: p.name,
        description: p.description,
        orderIndex: p.orderIndex,
        status: 'not_started',
        estimatedDuration: p.estimatedDuration,
        projectId: project.id,
      }),
    );
    if (phases.length) await manager.save(phases);

    const taskByTitle = new Map<string, Task>();
    const tasksToSave: Task[] = [];
    plan.phases.forEach((planPhase, pi) => {
      const phase = phases[pi];
      planPhase.tasks.forEach((t, ti) => {
        const entity = manager.create(Task, {
          title: t.title,
          description: t.description,
          priority: t.priority,
          status: 'todo',
          estimatedHours: t.estimatedHours,
          boardPosition: ti,
          projectId: project.id,
          phaseId: phase.id,
        });
        tasksToSave.push(entity);
        taskByTitle.set(t.title, entity);
      });
    });
    if (tasksToSave.length) await manager.save(tasksToSave);

    const dependencies: TaskDependency[] = [];
    plan.phases.forEach((planPhase) => {
      planPhase.tasks.forEach((t) => {
        const task = taskByTitle.get(t.title);
        if (!task) return;
        for (const depTitle of t.dependsOn ?? []) {
          const dep = taskByTitle.get(depTitle);
          if (dep && dep.id !== task.id) {
            dependencies.push(
              manager.create(TaskDependency, { taskId: task.id, dependsOnId: dep.id }),
            );
          }
        }
      });
    });
    if (dependencies.length) await manager.save(dependencies);

    // ── Tests ────────────────────────────────────────────────────────────────
    const tests = plan.tests.map((t, i) =>
      manager.create(TestCase, {
        title: t.title,
        category: t.category,
        input: t.input,
        expectedResult: t.expectedResult,
        status: 'not_tested',
        target: t.target ?? null,
        position: i,
        projectId: project.id,
      }),
    );
    if (tests.length) await manager.save(tests);

    return project;
  });
}
