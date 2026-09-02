import rateLimit, { ipKeyGenerator, type Options } from 'express-rate-limit';
import type { Request } from 'express';
import { env } from '../config/env';

/**
 * Rate limits are keyed by user id when a session exists, falling back to IP.
 *
 * Keying on IP alone would let one user behind a shared NAT exhaust everyone's
 * budget, and would also be trivially reset by reconnecting.
 *
 * The fallback goes through `ipKeyGenerator` rather than using `req.ip`
 * directly: a single IPv6 customer typically controls a whole /64, so a raw
 * address would hand them an unlimited supply of distinct keys. The helper
 * collapses IPv6 to its /56 subnet, which is what makes the limit meaningful.
 */
function keyGenerator(req: Request): string {
  if (req.user?.id) return `user:${req.user.id}`;
  return `ip:${ipKeyGenerator(req.ip ?? 'unknown')}`;
}

const shared: Partial<Options> = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator,
  // Match the API's error envelope so the client's error handling is uniform.
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json({
      error: {
        code: 'rate_limited',
        message: 'Too many requests. Please slow down and try again shortly.',
      },
    });
  },
};

/** Broad protection for the whole API surface. */
export const globalLimiter = rateLimit({
  ...shared,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
});

/**
 * §24 explicitly calls for rate limiting on AI endpoints. These are the
 * expensive ones — plan generation, chat, change analysis — so they get a much
 * tighter budget than ordinary CRUD.
 */
export const aiLimiter = rateLimit({
  ...shared,
  windowMs: env.AI_RATE_LIMIT_WINDOW_MS,
  limit: env.AI_RATE_LIMIT_MAX,
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json({
      error: {
        code: 'ai_rate_limited',
        message:
          'You are generating faster than we can keep up. Give it a few seconds and try again.',
      },
    });
  },
});

/** Credential endpoints: slow down password guessing without locking accounts. */
export const authLimiter = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: 40,
  // Successful sign-ins shouldn't count toward a brute-force budget.
  skipSuccessfulRequests: true,
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json({
      error: {
        code: 'rate_limited',
        message: 'Too many attempts. Please wait a few minutes before trying again.',
      },
    });
  },
});
