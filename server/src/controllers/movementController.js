const asyncHandler = require('../utils/asyncHandler');
const movementService = require('../services/movementService');

exports.list = asyncHandler(async (req, res) => {
  res.json(await movementService.listForUser(req.user.id));
});

exports.create = asyncHandler(async (req, res) => {
  const movement = await movementService.create(req.body, { userId: req.user.id });
  res.status(201).json(movement);
});

exports.update = asyncHandler(async (req, res) => {
  res.json(await movementService.update(req.user.id, req.params.id, req.body));
});

/** Reports what a delete would disturb, so the UI can warn first. */
exports.usage = asyncHandler(async (req, res) => {
  res.json(await movementService.usage(req.user.id, req.params.id));
});

exports.remove = asyncHandler(async (req, res) => {
  res.json(await movementService.remove(req.user.id, req.params.id));
});
