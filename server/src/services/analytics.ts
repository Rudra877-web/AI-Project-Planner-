import type { ProjectPhase } from '../entities/ProjectPhase';
import type { Task } from '../entities/Task';
import type { TestCase } from '../entities/TestCase';

export interface ProgressSummary {
  totalTasks: number;
  completedTasks: number;
  percentComplete: number;
  totalEstimatedHours: number;
  completedEstimatedHours: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

/** Rounds to the nearest whole percent; 0 tasks reads as 0%, not NaN%. */
function pct(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

export function taskProgress(tasks: Task[]): ProgressSummary {
  const completed = tasks.filter((t) => t.status === 'completed');
  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};

  for (const t of tasks) {
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
    byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1;
  }

  return {
    totalTasks: tasks.length,
    completedTasks: completed.length,
    percentComplete: pct(completed.length, tasks.length),
    totalEstimatedHours: tasks.reduce((sum, t) => sum + t.estimatedHours, 0),
    completedEstimatedHours: completed.reduce((sum, t) => sum + t.estimatedHours, 0),
    byStatus,
    byPriority,
  };
}

export interface PhaseProgress {
  id: string;
  name: string;
  orderIndex: number;
  status: string;
  totalTasks: number;
  completedTasks: number;
  percentComplete: number;
}

export function phaseProgress(phases: ProjectPhase[]): PhaseProgress[] {
  return [...phases]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((phase) => {
      const tasks = phase.tasks ?? [];
      const completed = tasks.filter((t) => t.status === 'completed').length;
      return {
        id: phase.id,
        name: phase.name,
        orderIndex: phase.orderIndex,
        status: phase.status,
        totalTasks: tasks.length,
        completedTasks: completed,
        percentComplete: pct(completed, tasks.length),
      };
    });
}

export interface TestSummary {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  passRate: number;
}

export function testSummary(tests: TestCase[]): TestSummary {
  const byStatus: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  for (const t of tests) {
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
    byCategory[t.category] = (byCategory[t.category] ?? 0) + 1;
  }
  const run = tests.filter((t) => t.status !== 'not_tested').length;
  const passed = byStatus.pass ?? 0;
  return { total: tests.length, byStatus, byCategory, passRate: pct(passed, run) };
}

/**
 * Velocity: completed hours per day over the last N days, derived from
 * `completedAt`. Used by the §20 dashboard chart.
 */
export function velocitySeries(tasks: Task[], days = 14): Array<{ date: string; hours: number; tasks: number }> {
  const buckets = new Map<string, { hours: number; tasks: number }>();
  const now = new Date();

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), { hours: 0, tasks: 0 });
  }

  for (const task of tasks) {
    if (!task.completedAt) continue;
    const key = new Date(task.completedAt).toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.hours += task.estimatedHours;
      bucket.tasks += 1;
    }
  }

  return [...buckets.entries()].map(([date, v]) => ({ date, ...v }));
}
