const mongoose = require('mongoose');

const DishSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fat: { type: Number, required: true },
  lastUsed: { type: Date, default: Date.now }
});

// Ensure a user can only have one saved entry for a specific dish name (case-insensitive handled in code)
DishSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Dish', DishSchema);
