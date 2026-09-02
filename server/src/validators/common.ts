import { z } from 'zod';

/**
 * Shared field builders.
 *
 * `emailField` is piped rather than chained for a real reason: in zod 4,
 * `z.email().trim()` runs the format check *before* the trim, so a value with
 * surrounding whitespace is rejected instead of cleaned. Normalising first and
 * piping into the format check is the order users expect.
 */
export const emailField = z.string().trim().toLowerCase().pipe(z.email());

export const passwordField = z
  .string()
  .min(8, { error: 'Use at least 8 characters.' })
  .max(200, { error: 'That password is too long.' });

export const uuidField = z.string().uuid({ error: 'Expected a valid id.' });

/** Trimmed, non-empty, length-bounded text. */
export const text = (min: number, max: number) => z.string().trim().min(min).max(max);

/** Optional trimmed text where an empty string means "clear it". */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === '' ? null : (v ?? undefined)));

/** Route params carrying an id. */
export const idParams = z.object({ id: uuidField });
export const projectIdParams = z.object({ projectId: uuidField });

/**
 * Pagination shared by list endpoints. Coerced from query strings, with bounded
 * `limit` so a client cannot ask for the entire table.
 */
export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
