const asyncHandler = require('../utils/asyncHandler');
const goalsService = require('../services/goalsService');

exports.get = asyncHandler(async (req, res) => {
  res.json(await goalsService.get(req.user.id));
});

exports.update = asyncHandler(async (req, res) => {
  res.json(await goalsService.update(req.user.id, req.body));
});
