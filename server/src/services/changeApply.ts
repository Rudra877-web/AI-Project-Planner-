import type { EntityManager } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import { DatabaseTable } from '../entities/DatabaseTable';
import { DatabaseField } from '../entities/DatabaseField';
import { ApiEndpoint } from '../entities/ApiEndpoint';
import { Page } from '../entities/Page';
import { Task } from '../entities/Task';
import { TestCase } from '../entities/TestCase';
import { ProjectChange } from '../entities/ProjectChange';
import type { Project } from '../entities/Project';
import type { ImpactAnalysis } from '../types/domain';

export interface AppliedSummary {
  tablesCreated: number;
  fieldsCreated: number;
  endpointsCreated: number;
  pagesCreated: number;
  tasksCreated: number;
  testsCreated: number;
}

/**
 * Replays a change's `impact` payload into the live plan, in one transaction,
 * stamping every row it writes with `originChangeId` — which is what lets the
 * UI later show "added by this change" and is why every affected entity
 * carries that column.
 */
export async function applyImpactAnalysis(
  project: Project,
  change: ProjectChange,
  impact: ImpactAnalysis,
): Promise<AppliedSummary> {
  return AppDataSource.transaction(async (manager: EntityManager) => {
    const summary: AppliedSummary = {
      tablesCreated: 0,
      fieldsCreated: 0,
      endpointsCreated: 0,
      pagesCreated: 0,
      tasksCreated: 0,
      testsCreated: 0,
    };

    const existingTables = await manager.find(DatabaseTable, { where: { projectId: project.id } });
    const [maxTablePos, maxEndpointPos, maxPagePos, maxTestPos] = await Promise.all([
      manager.count(DatabaseTable, { where: { projectId: project.id } }),
      manager.count(ApiEndpoint, { where: { projectId: project.id } }),
      manager.count(Page, { where: { projectId: project.id } }),
      manager.count(TestCase, { where: { projectId: project.id } }),
    ]);

    for (const [i, affected] of impact.affectedTables.entries()) {
      if (affected.action !== 'create') continue;
      if (existingTables.some((t) => t.name.toLowerCase() === affected.name.toLowerCase())) continue;

      const table = manager.create(DatabaseTable, {
        name: affected.name,
        description: affected.reason,
        position: maxTablePos + i,
        originChangeId: change.id,
        projectId: project.id,
      });
      await manager.save(table);
      summary.tablesCreated += 1;

      const fields = (affected.fields ?? []).map((f, fi) =>
        manager.create(DatabaseField, {
          name: f.name,
          dataType: f.dataType,
          isPrimary: f.isPrimary ?? false,
          isForeign: f.isForeign ?? false,
          isNullable: f.nullable ?? true,
          defaultValue: f.defaultValue ?? null,
          description: f.description ?? null,
          referencesTable: f.references ?? null,
          position: fi,
          tableId: table.id,
        }),
      );
      if (fields.length) {
        await manager.save(fields);
        summary.fieldsCreated += fields.length;
      }
    }

    const endpoints = impact.newEndpoints.map((e, i) =>
      manager.create(ApiEndpoint, {
        method: e.method,
        path: e.path,
        description: e.description,
        requiresAuth: e.requiresAuth,
        requestBody: e.requestBody ?? null,
        responseExample: e.responseExample ?? null,
        relatedTables: e.relatedTables ?? [],
        position: maxEndpointPos + i,
        originChangeId: change.id,
        projectId: project.id,
      }),
    );
    if (endpoints.length) {
      await manager.save(endpoints);
      summary.endpointsCreated = endpoints.length;
    }

    const pages = impact.newPages.map((p, i) =>
      manager.create(Page, {
        name: p.name,
        route: p.route,
        purpose: p.purpose,
        components: p.components ?? [],
        userActions: p.userActions ?? [],
        apis: p.apis ?? [],
        entities: p.entities ?? [],
        position: maxPagePos + i,
        originChangeId: change.id,
        projectId: project.id,
      }),
    );
    if (pages.length) {
      await manager.save(pages);
      summary.pagesCreated = pages.length;
    }

    const tasks = impact.newTasks.map((t) =>
      manager.create(Task, {
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: 'todo',
        estimatedHours: t.estimatedHours,
        originChangeId: change.id,
        projectId: project.id,
      }),
    );
    if (tasks.length) {
      await manager.save(tasks);
      summary.tasksCreated = tasks.length;
    }

    const tests = impact.newTests.map((t, i) =>
      manager.create(TestCase, {
        title: t.title,
        category: t.category,
        input: t.input,
        expectedResult: t.expectedResult,
        status: 'not_tested',
        position: maxTestPos + i,
        originChangeId: change.id,
        projectId: project.id,
      }),
    );
    if (tests.length) {
      await manager.save(tests);
      summary.testsCreated = tests.length;
    }

    change.status = 'accepted';
    change.resolvedAt = new Date();
    change.appliedSummary = summary as unknown as Record<string, number>;
    await manager.save(change);

    return summary;
  });
}
