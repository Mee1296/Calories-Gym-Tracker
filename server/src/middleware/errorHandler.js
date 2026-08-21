const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => next(ApiError.notFound(`No route for ${req.method} ${req.originalUrl}`));

/**
 * Drizzle wraps driver failures in a DrizzleQueryError, so the Postgres error —
 * and its code — is on `cause`. Walk the chain to find it.
 */
const driverError = (err) => {
  let current = err;
  for (let depth = 0; current && depth < 5; depth += 1) {
    if (current.code) return current;
    current = current.cause;
  }
  return err;
};

/**
 * Translates Postgres driver failures into the same envelope as ApiError.
 * Codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const normalize = (rawError) => {
  if (rawError instanceof ApiError) return rawError;
  const err = driverError(rawError);

  switch (err.code) {
    case '23505': // unique_violation
      return ApiError.conflict('That already exists', err.detail ? { detail: err.detail } : undefined);
    case '23503': // foreign_key_violation — referenced row is missing
      return ApiError.badRequest('That references something which no longer exists');
    case '23514': // check_violation
      return ApiError.badRequest('That value is out of the allowed range');
    case '23502': // not_null_violation
      return ApiError.badRequest(`"${err.column}" is required`);
    case '22P02': // invalid_text_representation — e.g. a malformed uuid in the path
      return ApiError.badRequest('Malformed identifier');
    default:
      return null;
  }
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const apiError = normalize(err);

  if (!apiError) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
    return res.status(500).json({ error: { message: 'Something went wrong on our side' } });
  }

  return res.status(apiError.status).json({
    error: {
      message: apiError.message,
      ...(apiError.details ? { details: apiError.details } : {}),
      ...(env.isProduction ? {} : { stack: apiError.stack }),
    },
  });
};

module.exports = { notFound, errorHandler };
