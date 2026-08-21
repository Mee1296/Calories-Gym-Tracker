const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * Rate limits share the app's error envelope so the client's `errorMessage`
 * helper renders them like any other failure.
 */
const handler = (message) => (req, res, next) => next(ApiError.tooManyRequests(message));

const common = {
  standardHeaders: true,
  legacyHeaders: false,
  // Disabled outside production so local testing and the e2e checks are not
  // throttled; the limits below are tuned for a single-user-ish app.
  skip: () => !env.isProduction,
};

/**
 * Credential endpoints. Without this a password is guessable at request speed —
 * bcrypt makes each attempt cost the server more than the attacker.
 */
const authLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  handler: handler('Too many attempts. Try again in a few minutes.'),
});

/** The AI endpoints cost money per call, so they get a tighter budget. */
const aiLimiter = rateLimit({
  ...common,
  windowMs: 60 * 60 * 1000,
  limit: 60,
  handler: handler('AI request limit reached. Try again later.'),
});

/** A broad ceiling on everything else, well above real interactive use. */
const apiLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  limit: 240,
  handler: handler('Slow down a moment.'),
});

module.exports = { authLimiter, aiLimiter, apiLimiter };
