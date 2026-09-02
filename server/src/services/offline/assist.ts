import type { Task } from '../../entities/Task';
import type { Project } from '../../entities/Project';
import type { DebugExplanation, StuckGuidance } from '../../types/plan';

/**
 * Offline stand-ins for the three AI "assist" surfaces (§12).
 *
 * These are intentionally generic rather than pretending to real reasoning —
 * an honest, useful checklist beats a confident-sounding guess when there is
 * no model behind it. `services/ai/provider.ts` only reaches here when Claude
 * is disabled or a live call fails.
 */

export function offlineStuckGuidance(task: Task, project: Project): StuckGuidance {
  return {
    taskTitle: task.title,
    prerequisites: [
      `The ${project.name} project is scaffolded and running locally`,
      task.phase ? `The previous tasks in "${task.phase.name}" are complete` : 'Any tasks this one depends on are complete',
    ],
    steps: [
      { title: 'Re-read the task description', detail: task.description ?? 'Write down, in one sentence, what "done" looks like for this task before writing any code.' },
      { title: 'Break it into the smallest testable step', detail: 'Find the smallest change you can make and verify — one endpoint, one component, one query — rather than the whole feature at once.' },
      { title: 'Check the plan\u2019s connected pieces', detail: 'Look at which pages, API endpoints and tables this task touches in the plan, and confirm each one already exists.' },
      { title: 'Search the error, not the feature', detail: 'If something is failing, search the exact error message rather than the general topic — it narrows results dramatically.' },
      { title: 'Write a test before the fix', detail: 'A failing test that describes the desired behaviour makes it obvious when the task is actually finished.' },
    ],
    commonErrors: [
      {
        error: 'Cannot read properties of undefined',
        cause: 'Data is used before it has loaded, or an API response shape does not match what the code expects.',
        fix: 'Log the value immediately before the failing line and confirm its shape matches your assumption.',
      },
      {
        error: '401 Unauthorized on an authenticated request',
        cause: 'The session cookie or token is missing, expired, or not being sent with the request.',
        fix: 'Confirm the client sends credentials and that the session has not expired.',
      },
    ],
    codeExample: null,
    resources: [
      { label: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
      { label: 'Stack Overflow', url: 'https://stackoverflow.com' },
    ],
  };
}

export function offlineDebugExplanation(errorText: string, context?: string): DebugExplanation {
  const lower = errorText.toLowerCase();

  const known: Array<{ match: RegExp; cause: string; solution: string }> = [
    {
      match: /cors/,
      cause: 'The server\u2019s allowed-origins list does not include the origin the request came from.',
      solution: 'Add the exact origin (protocol + host + port) to the server\u2019s CORS configuration and ensure credentials are enabled on both sides.',
    },
    {
      match: /econnrefused|failed to fetch|network ?error/,
      cause: 'The client could not reach the server — it is not running, is on a different port, or the URL is wrong.',
      solution: 'Confirm the server is running and that the client\u2019s base URL matches the port it is listening on.',
    },
    {
      match: /undefined is not an object|cannot read propert(y|ies) of undefined/,
      cause: 'Code accessed a property on a value that was null or undefined at that point in execution.',
      solution: 'Log the value right before the failing line, and guard the access or fix wherever it should have been set.',
    },
    {
      match: /unique constraint|duplicate key/,
      cause: 'The database rejected an insert or update because a unique column already has that value.',
      solution: 'Check the value for uniqueness before writing, or catch the constraint error and return a clear message.',
    },
    {
      match: /jwt|token.*(expired|invalid)/,
      cause: 'The session token is missing, malformed, expired, or signed with a different secret than the one verifying it.',
      solution: 'Re-authenticate to get a fresh token, and confirm the signing secret matches between issue and verify.',
    },
  ];

  const hit = known.find((k) => k.match.test(lower));

  return {
    summary: context ? `Debugging: ${context}` : 'Debugging the error below.',
    error: errorText,
    cause: hit?.cause ?? 'The exact cause depends on where in the code this was thrown — check the surrounding stack trace for the first line that belongs to your own code.',
    solution:
      hit?.solution ??
      'Reproduce the error with the smallest possible input, add a log statement immediately before the failure, and compare the actual value against what the code assumes.',
    example: null,
    relatedChecks: [
      'Is the server actually running and reachable?',
      'Does the request payload match what the endpoint expects?',
      'Is the error happening on the client or the server?',
    ],
  };
}

export function offlineChatReply(message: string, project: Project): string {
  return (
    `I'm running in offline mode right now, so I can't have a full conversation, ` +
    `but here's what I can tell you about **${project.name}**: it's a ${project.type} project ` +
    `currently ${project.status.replace('_', ' ')}. ` +
    `For specific help with "${message.slice(0, 120)}", try the Roadmap tab for tasks, ` +
    `the Database and API tabs for the schema and endpoints, or set an ANTHROPIC_API_KEY ` +
    `on the server to enable full AI chat.`
  );
}
