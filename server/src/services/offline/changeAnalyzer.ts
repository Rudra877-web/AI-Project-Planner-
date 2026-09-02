import type { Project } from '../../entities/Project';
import type { ImpactAnalysis } from '../../types/domain';

/**
 * Offline §13 Change Impact Analyzer.
 *
 * Without a model to reason about the request, this cannot invent a truly new
 * table or endpoint — it can only propose one plausible, clearly-labelled
 * addition from the request text itself, and say so. That is more honest than
 * fabricating a confident-looking diagram from a heuristic.
 */
export function offlineImpactAnalysis(request: string, project: Project): ImpactAnalysis {
  const trimmed = request.trim();
  const words = trimmed
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const nameGuess = (words.find((w) => /^[A-Za-z]+$/.test(w)) ?? 'feature').toLowerCase();
  const tableName = `${nameGuess}s`;
  const alreadyExists = (project.databaseTables ?? []).some(
    (t) => t.name.toLowerCase() === tableName,
  );

  return {
    summary:
      `Offline analysis of: "${trimmed.slice(0, 160)}". ` +
      `This is a best-effort heuristic — enable Claude (set ANTHROPIC_API_KEY) for a real ` +
      `breakdown of exactly which tables, endpoints and pages this change touches.`,
    affectedTables: alreadyExists
      ? []
      : [
          {
            name: tableName,
            action: 'create',
            reason: `The request mentions "${nameGuess}", which does not yet have a table.`,
            fields: [
              { name: 'id', dataType: 'uuid', isPrimary: true },
              { name: 'title', dataType: 'varchar(240)' },
              { name: 'createdAt', dataType: 'timestamp' },
            ],
          },
        ],
    newEndpoints: alreadyExists
      ? []
      : [
          {
            method: 'GET',
            path: `/api/${tableName}`,
            description: `List ${tableName}.`,
            requiresAuth: true,
            relatedTables: [tableName],
          },
          {
            method: 'POST',
            path: `/api/${tableName}`,
            description: `Create a ${nameGuess}.`,
            requiresAuth: true,
            relatedTables: [tableName],
          },
        ],
    newPages: [],
    newTasks: [
      {
        title: `Implement: ${trimmed.slice(0, 80)}`,
        description: trimmed,
        priority: 'medium',
        estimatedHours: 4,
      },
    ],
    newTests: [
      {
        title: `Verify: ${trimmed.slice(0, 80)}`,
        category: 'integration',
        input: 'Exercise the new behaviour end to end',
        expectedResult: 'Behaves as requested without breaking existing functionality',
      },
    ],
    risks: [
      'This is an offline, heuristic analysis — review carefully before accepting.',
      'Enable Claude for a change breakdown grounded in the actual current plan.',
    ],
  };
}
