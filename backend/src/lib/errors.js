export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (code, message, details) => new ApiError(400, code, message, details);
export const unauthorized = (message = 'Sign in to continue.') => new ApiError(401, 'unauthorized', message);
export const notFound = (message = 'Not found.') => new ApiError(404, 'not_found', message);
export const conflict = (code, message) => new ApiError(409, code, message);

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'invalid_json', message: 'Request body is not valid JSON.' } });
  }
  console.error(err);
  return res.status(500).json({ error: { code: 'internal', message: 'Something went wrong on our side. Try again in a moment.' } });
}

/** Wrap async route handlers so rejections reach the error handler. */
export const handle = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
