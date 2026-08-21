/**
 * The shared movement library and starter routines.
 * Seeded once via `npm run seed`; new accounts get their own copy of the routines.
 */

const MOVEMENTS = [
  // chest
  { name: 'Bench Press', group: 'chest', defaultWeight: 60, defaultReps: 8 },
  { name: 'Incline Dumbbell Press', group: 'chest', defaultWeight: 24, defaultReps: 10 },
  { name: 'Chest Fly', group: 'chest', defaultWeight: 16, defaultReps: 12 },
  { name: 'Push-up', group: 'chest', defaultWeight: 0, defaultReps: 15 },
  // back
  { name: 'Deadlift', group: 'back', defaultWeight: 100, defaultReps: 6 },
  { name: 'Lat Pulldown', group: 'back', defaultWeight: 55, defaultReps: 10 },
  { name: 'Seated Row', group: 'back', defaultWeight: 50, defaultReps: 10 },
  { name: 'Pull-up', group: 'back', defaultWeight: 0, defaultReps: 8 },
  // shoulders
  { name: 'Overhead Press', group: 'shoulders', defaultWeight: 40, defaultReps: 10 },
  { name: 'Lateral Raise', group: 'shoulders', defaultWeight: 10, defaultReps: 14 },
  { name: 'Face Pull', group: 'shoulders', defaultWeight: 25, defaultReps: 15 },
  // arms
  { name: 'Biceps Curl', group: 'arms', defaultWeight: 12, defaultReps: 12 },
  { name: 'Hammer Curl', group: 'arms', defaultWeight: 12, defaultReps: 12 },
  { name: 'Triceps Pushdown', group: 'arms', defaultWeight: 28, defaultReps: 12 },
  { name: 'Skullcrusher', group: 'arms', defaultWeight: 20, defaultReps: 10 },
  // legs
  { name: 'Squat', group: 'legs', defaultWeight: 90, defaultReps: 8 },
  { name: 'Romanian Deadlift', group: 'legs', defaultWeight: 70, defaultReps: 10 },
  { name: 'Leg Press', group: 'legs', defaultWeight: 150, defaultReps: 10 },
  { name: 'Lunge', group: 'legs', defaultWeight: 16, defaultReps: 12 },
  { name: 'Calf Raise', group: 'legs', defaultWeight: 55, defaultReps: 15 },
  // core
  { name: 'Cable Crunch', group: 'core', defaultWeight: 30, defaultReps: 15 },
  { name: 'Hanging Leg Raise', group: 'core', defaultWeight: 0, defaultReps: 12 },
  { name: 'Plank', group: 'core', defaultWeight: 0, defaultReps: 45 },
];

// Referenced by movement name; resolved to ids when a routine is created.
const STARTER_ROUTINES = [
  {
    name: 'Push Day',
    exercises: [
      { name: 'Bench Press', sets: 4, weight: 80, reps: 8 },
      { name: 'Overhead Press', sets: 3, weight: 45, reps: 10 },
      { name: 'Incline Dumbbell Press', sets: 3, weight: 26, reps: 10 },
      { name: 'Triceps Pushdown', sets: 3, weight: 30, reps: 12 },
    ],
  },
  {
    name: 'Pull Day',
    exercises: [
      { name: 'Deadlift', sets: 3, weight: 120, reps: 6 },
      { name: 'Lat Pulldown', sets: 3, weight: 60, reps: 10 },
      { name: 'Seated Row', sets: 3, weight: 55, reps: 10 },
      { name: 'Biceps Curl', sets: 3, weight: 14, reps: 12 },
    ],
  },
  {
    name: 'Leg Day',
    exercises: [
      { name: 'Squat', sets: 4, weight: 100, reps: 8 },
      { name: 'Romanian Deadlift', sets: 3, weight: 80, reps: 10 },
      { name: 'Leg Press', sets: 3, weight: 160, reps: 10 },
      { name: 'Calf Raise', sets: 3, weight: 60, reps: 15 },
    ],
  },
];

const GROUP_LABELS = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  arms: 'Arms',
  legs: 'Legs',
  core: 'Core',
};

module.exports = { MOVEMENTS, STARTER_ROUTINES, GROUP_LABELS };
