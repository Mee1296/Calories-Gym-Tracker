const asyncHandler = require('../utils/asyncHandler');
const statsService = require('../services/statsService');

exports.overview = asyncHandler(async (req, res) => {
  const days = Math.min(365, Math.max(7, Number(req.query.days) || 28));
  res.json(await statsService.overview(req.user.id, { days }));
});
