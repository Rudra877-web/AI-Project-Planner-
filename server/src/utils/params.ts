import type { Request } from 'express';

/**
 * Reads a single route parameter.
 *
 * Express 5 types `req.params[key]` as `string | string[]`, because a pattern
 * can bind a name more than once. Every route in BuildFlow binds each name
 * once, so narrowing here keeps that cast out of every controller — and out of
 * `where` clauses, where TypeORM 1.x would reject a non-string outright.
 */
export function param(req: Request, name: string): string | undefined {
  const value = req.params[name as keyof typeof req.params] as unknown;
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

/** Reads a single query-string value, ignoring repeats. */
export function queryParam(req: Request, name: string): string | undefined {
  const value = (req.query as Record<string, unknown>)[name];
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}
