/**
 * Row -> API JSON.
 *
 * The client is unchanged by this migration, so these functions must keep the
 * exact shapes the Mongo version returned: `_id` keys, a nested `goals` object,
 * numeric (not string) macros. Postgres returns `numeric` columns as strings,
 * so every one of them goes through `n()`.
 */

const n = (value) => (value === null || value === undefined ? null : Number(value));

const macros = (row) => ({
  calories: row.calories,
  protein: row.protein,
  carbs: row.carbs,
  fat: row.fat,
});

const user = (row) => ({
  id: row.id,
  username: row.username,
  role: row.role,
  goals: {
    calories: row.goalCalories,
    protein: row.goalProtein,
    carbs: row.goalCarbs,
    fat: row.goalFat,
  },
  profile: {
    ...(row.profileHeightCm !== null ? { heightCm: n(row.profileHeightCm) } : {}),
    ...(row.profileAge !== null ? { age: row.profileAge } : {}),
    ...(row.profileGender ? { gender: row.profileGender } : {}),
    ...(row.profileBodyFat !== null ? { bodyFat: n(row.profileBodyFat) } : {}),
    ...(row.profileActivityLevel ? { activityLevel: row.profileActivityLevel } : {}),
    ...(row.profileGoal ? { goal: row.profileGoal } : {}),
  },
});

const goals = (row) => ({
  calories: row.goalCalories,
  protein: row.goalProtein,
  carbs: row.goalCarbs,
  fat: row.goalFat,
});

const movement = (row) => ({
  _id: row.id,
  name: row.name,
  group: row.muscleGroup,
  defaultWeight: n(row.defaultWeight),
  defaultReps: row.defaultReps,
  userId: row.userId,
});

const routine = (row, exercises = []) => ({
  _id: row.id,
  name: row.name,
  note: row.note,
  isStarter: row.isStarter,
  exercises: exercises.map((e) => ({
    movementId: e.movementId,
    name: e.name,
    sets: e.sets,
    weight: n(e.weight),
    reps: e.reps,
  })),
});

const workout = (row, exercises = []) => ({
  _id: row.id,
  name: row.name,
  routineId: row.routineId,
  startedAt: row.startedAt,
  endedAt: row.endedAt,
  duration: row.duration,
  totalSets: row.totalSets,
  volume: row.volume,
  exercises: exercises.map((e) => ({
    movementId: e.movementId,
    name: e.name,
    sets: (e.sets || []).map((s) => ({ weight: n(s.weight), reps: s.reps })),
  })),
});

/** `date` columns come back as 'YYYY-MM-DD'; the client only ever formats them. */
const weight = (row) => ({
  _id: row.id,
  kg: n(row.kg),
  date: row.date,
});

const meal = (row) => ({
  _id: row.id,
  name: row.name,
  ...macros(row),
  ingredients: row.ingredients || [],
  source: row.source,
  date: row.date,
  loggedAt: row.loggedAt,
});

const dish = (row) => ({
  _id: row.id,
  name: row.name,
  slug: row.slug,
  ...macros(row),
  ingredients: row.ingredients || [],
  useCount: row.useCount,
  lastUsed: row.lastUsed,
});

module.exports = { n, user, goals, movement, routine, workout, weight, meal, dish };
