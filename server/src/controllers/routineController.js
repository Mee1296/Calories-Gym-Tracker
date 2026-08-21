const asyncHandler = require('../utils/asyncHandler');
const routineService = require('../services/routineService');

exports.list = asyncHandler(async (req, res) => {
  res.json(await routineService.list(req.user.id));
});

exports.create = asyncHandler(async (req, res) => {
  const routine = await routineService.create(req.user.id, req.body);
  res.status(201).json(routine);
});

exports.update = asyncHandler(async (req, res) => {
  res.json(await routineService.update(req.user.id, req.params.id, req.body));
});

exports.remove = asyncHandler(async (req, res) => {
  await routineService.remove(req.user.id, req.params.id);
  res.status(204).end();
});
