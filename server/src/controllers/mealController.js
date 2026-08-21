const asyncHandler = require('../utils/asyncHandler');
const mealService = require('../services/mealService');
const dishService = require('../services/dishService');
const goalsService = require('../services/goalsService');

/** One call for everything the Today screen needs. */
exports.day = asyncHandler(async (req, res) => {
  const date = req.query.date;
  const [{ meals, totals }, { goals }] = await Promise.all([
    mealService.listForDay(req.user.id, date),
    goalsService.get(req.user.id),
  ]);
  res.json({ date: date || null, meals, totals, goals });
});

exports.log = asyncHandler(async (req, res) => {
  const meal = await mealService.log(req.user.id, req.body);
  res.status(201).json(meal);
});

exports.remove = asyncHandler(async (req, res) => {
  await mealService.remove(req.user.id, req.params.id);
  res.status(204).end();
});

exports.dishes = asyncHandler(async (req, res) => {
  const dishes = await dishService.list(req.user.id, {
    query: req.query.q,
    limit: Math.min(50, Number(req.query.limit) || 20),
  });
  res.json(dishes);
});

exports.removeDish = asyncHandler(async (req, res) => {
  await dishService.remove(req.user.id, req.params.id);
  res.status(204).end();
});
