import type { ErrorRequestHandler, RequestHandler } from 'express';
import { env } from '../config/env';
import { HttpError, NotFoundError } from '../utils/errors';

/** 404 for unmatched routes, so the client always gets JSON rather than HTML. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`No route for ${req.method} ${req.originalUrl}`));
};

/**
 * Single JSON error shape for the whole API:
 *
 *   { error: { code, message, details? } }
 *
 * Express 5 forwards rejected promises from async handlers here automatically,
 * so controllers can `throw` freely without a try/catch or an asyncHandler wrap.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const isHttp = err instanceof HttpError;
  const status = isHttp ? err.status : 500;

  // Unexpected failures are logged in full; expected ones would just be noise.
  if (!isHttp || status >= 500) {
    console.error('[api]', err);
  }

  const message = isHttp
    ? err.message
    : env.isProduction
      ? 'Something went wrong on our end.'
      : (err as Error)?.message ?? 'Unknown error';

  res.status(status).json({
    error: {
      code: isHttp ? err.code : 'internal_error',
      message,
      ...(isHttp && err.details ? { details: err.details } : {}),
      // Stacks are useful locally and a liability in production.
      ...(!env.isProduction && !isHttp ? { stack: (err as Error)?.stack } : {}),
    },
  });
};
