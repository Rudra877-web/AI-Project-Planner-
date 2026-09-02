/**
 * Typed HTTP errors.
 *
 * Throwing these from anywhere in a route (including inside an async handler —
 * Express 5 forwards rejected promises to the error middleware automatically)
 * produces a consistent JSON error shape without every controller writing its
 * own `res.status(...)` branch.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  /** Field-level messages, keyed by path — consumed by the client's form state. */
  readonly details?: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    code = 'error',
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, new.target);
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Bad request', details?: Record<string, string[]>) {
    super(400, message, 'bad_request', details);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'You need to sign in to do that.') {
    super(401, message, 'unauthorized');
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "You don't have access to that.") {
    super(403, message, 'forbidden');
  }
}

/**
 * Also used for resources that exist but belong to someone else. Returning 404
 * rather than 403 there is deliberate: a 403 would confirm that the id is real,
 * which leaks the existence of other users' projects.
 */
export class NotFoundError extends HttpError {
  constructor(message = 'Not found') {
    super(404, message, 'not_found');
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'That already exists.') {
    super(409, message, 'conflict');
  }
}

export class ValidationError extends HttpError {
  constructor(details: Record<string, string[]>, message = 'Please check the highlighted fields.') {
    super(422, message, 'validation_failed', details);
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(message = 'Too many requests. Please slow down.') {
    super(429, message, 'rate_limited');
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message = 'That service is temporarily unavailable.') {
    super(503, message, 'service_unavailable');
  }
}
