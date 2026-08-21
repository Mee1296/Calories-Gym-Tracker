const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

exports.register = asyncHandler(async (req, res) => {
  if (!env.allowRegistration) {
    throw ApiError.forbidden('Registration is closed on this deployment');
  }
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

/** Lets the sign-in screen decide whether to offer a "create account" tab. */
exports.config = (req, res) => res.json({ allowRegistration: env.allowRegistration });

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

exports.me = asyncHandler(async (req, res) => {
  res.json(await authService.getProfile(req.user.id));
});
