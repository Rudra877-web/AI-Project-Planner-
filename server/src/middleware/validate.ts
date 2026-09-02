import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '../utils/errors';

type Source = 'body' | 'query' | 'params';

function toDetails(issues: Array<{ path: PropertyKey[]; message: string }>) {
  const details: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join('.') || '_';
    (details[key] ??= []).push(issue.message);
  }
  return details;
}

/**
 * Validates and *replaces* the chosen request segment with the parsed result,
 * so handlers work with coerced, trimmed, known-shape data (§22).
 *
 * This matters more than usual with TypeORM 1.x, which throws when a `where`
 * clause receives `undefined` — parsing at the edge means a missing query
 * parameter surfaces as a 422 here rather than a 500 from deep inside a query.
 */
export function validate(schema: ZodType, source: Source = 'body'): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      throw new ValidationError(toDetails(result.error.issues));
    }

    // `req.query` is a getter on Express 5, so assign through defineProperty.
    if (source === 'query') {
      Object.defineProperty(req, 'query', {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else {
      req[source] = result.data as never;
    }

    next();
  };
}

/** Convenience wrappers, purely for readability at the route definitions. */
export const validateBody = (schema: ZodType) => validate(schema, 'body');
export const validateQuery = (schema: ZodType) => validate(schema, 'query');
export const validateParams = (schema: ZodType) => validate(schema, 'params');
