const asyncHandler = require('../utils/asyncHandler');
const aiService = require('../services/aiService');
const goalsService = require('../services/goalsService');

exports.status = (req, res) => res.json({ enabled: aiService.isConfigured() });

/**
 * Estimates a meal and returns it *without* logging — the client shows the
 * breakdown so the user can adjust before saving.
 */
exports.estimateMeal = asyncHandler(async (req, res) => {
  const estimate = await aiService.estimateMeal(req.body.description ?? req.body.dishName);
  res.json(estimate);
});

exports.suggestGoals = asyncHandler(async (req, res) => {
  const metrics = {
    weightKg: req.body.weightKg ?? req.body.weight,
    heightCm: req.body.heightCm ?? req.body.height,
    age: req.body.age,
    gender: req.body.gender,
    bodyFat: req.body.bodyFat,
    activityLevel: req.body.activityLevel,
    goal: req.body.goal,
  };
  const suggestion = await aiService.suggestGoals(metrics);
  await goalsService.saveProfile(req.user.id, metrics);
  res.json(suggestion);
});
