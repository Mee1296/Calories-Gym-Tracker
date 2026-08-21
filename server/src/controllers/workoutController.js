const asyncHandler = require('../utils/asyncHandler');
const workoutService = require('../services/workoutService');

exports.history = asyncHandler(async (req, res) => {
  const limit = Math.min(100, Number(req.query.limit) || 30);
  res.json(await workoutService.history(req.user.id, limit));
});

exports.create = asyncHandler(async (req, res) => {
  const { workout, prs } = await workoutService.create(req.user.id, req.body);
  res.status(201).json({ workout, prs });
});

exports.lastForMovement = asyncHandler(async (req, res) => {
  res.json(await workoutService.lastSetsFor(req.user.id, req.params.movementId));
});

/** Bulk variant: POST { movementIds: [...] } -> { [movementId]: { date, sets } }. */
exports.lastForMovements = asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body.movementIds) ? req.body.movementIds : [];
  res.json(await workoutService.lastSetsForMany(req.user.id, ids));
});
