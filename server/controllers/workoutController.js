const Workout = require('../models/Workout');

exports.finishWorkout = async (req, res) => {
  try {
    const { startTime, endTime, exercises } = req.body;
    const duration = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
    const workout = new Workout({
      userId: req.user.id,
      startTime,
      endTime,
      duration,
      exercises
    });
    await workout.save();
    res.status(201).json(workout);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

exports.getWorkoutHistory = async (req, res) => {
  try {
    const history = await Workout.find({ userId: req.user.id })
      .populate('exercises.movementId')
      .sort({ startTime: -1 });
    res.json(history);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

exports.getLastWorkoutByMovement = async (req, res) => {
  try {
    const lastWorkout = await Workout.findOne({
      userId: req.user.id,
      'exercises.movementId': req.params.movementId
    }).sort({ startTime: -1 });

    if (!lastWorkout) return res.json(null);

    const exercise = lastWorkout.exercises.find(
      e => e.movementId.toString() === req.params.movementId
    );
    res.json(exercise);
  } catch (err) {
    res.status(400).send(err.message);
  }
};
