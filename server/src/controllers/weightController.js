const asyncHandler = require('../utils/asyncHandler');
const weightService = require('../services/weightService');

exports.history = asyncHandler(async (req, res) => {
  const days = req.query.days ? Number(req.query.days) : undefined;
  res.json(await weightService.history(req.user.id, { days }));
});

exports.log = asyncHandler(async (req, res) => {
  const entry = await weightService.log(req.user.id, { kg: req.body.kg ?? req.body.weight, date: req.body.date });
  res.status(201).json(entry);
});

exports.remove = asyncHandler(async (req, res) => {
  await weightService.remove(req.user.id, req.params.id);
  res.status(204).end();
});
