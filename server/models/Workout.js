const mongoose = require('mongoose');

const SetSchema = new mongoose.Schema({
  weight: { type: Number, required: true },
  reps: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ExerciseLogSchema = new mongoose.Schema({
  movementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movement', required: true },
  sets: [SetSchema]
});

const WorkoutSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number }, // in seconds
  exercises: [ExerciseLogSchema]
});

module.exports = mongoose.model('Workout', WorkoutSchema);
