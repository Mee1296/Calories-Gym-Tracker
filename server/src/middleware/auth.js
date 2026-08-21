const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('Missing bearer token'));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { id: payload.id, role: payload.role, username: payload.username };
    return next();
  } catch (err) {
    const expired = err.name === 'TokenExpiredError';
    return next(ApiError.unauthorized(expired ? 'Session expired' : 'Invalid token'));
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return next(ApiError.forbidden('Admin access required'));
  return next();
};

module.exports = { authenticate, requireAdmin };
