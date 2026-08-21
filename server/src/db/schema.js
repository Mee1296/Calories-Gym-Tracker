const {
  pgTable, uuid, text, integer, numeric, boolean, date, timestamp, jsonb,
  uniqueIndex, index, check,
} = require('drizzle-orm/pg-core');
const { sql, relations } = require('drizzle-orm');

/**
 * Conventions
 * - snake_case columns; the API mapping layer converts to the JSON the client expects.
 * - `position` columns preserve the ordering Mongo got for free from arrays.
 * - JSONB only where a value is written and read whole and never queried into
 *   (meal/dish ingredients). Anything the app filters or aggregates on — notably
 *   workout sets, which PR detection scans — is a real table.
 */

const id = () => uuid('id').primaryKey().defaultRandom();
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();
const macro = (name) => integer(name).notNull().default(0);

/* ── users ───────────────────────────────────────────────────────── */

const users = pgTable('users', {
  id: id(),
  username: text('username').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('user'),

  // Goals live as columns rather than JSONB so they can carry check constraints.
  goalCalories: integer('goal_calories').notNull().default(2400),
  goalProtein: integer('goal_protein').notNull().default(160),
  goalCarbs: integer('goal_carbs').notNull().default(250),
  goalFat: integer('goal_fat').notNull().default(75),

  profileHeightCm: numeric('profile_height_cm', { precision: 5, scale: 1 }),
  profileAge: integer('profile_age'),
  profileGender: text('profile_gender'),
  profileBodyFat: numeric('profile_body_fat', { precision: 4, scale: 1 }),
  profileActivityLevel: text('profile_activity_level').default('moderately active'),
  profileGoal: text('profile_goal').default('maintain'),

  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  uniqueIndex('users_username_key').on(sql`lower(${t.username})`),
  check('users_role_check', sql`${t.role} in ('user','admin')`),
  check('users_goal_calories_check', sql`${t.goalCalories} > 0`),
]);

/* ── movements ───────────────────────────────────────────────────── */

const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'];

const movements = pgTable('movements', {
  id: id(),
  name: text('name').notNull(),
  muscleGroup: text('muscle_group').notNull(), // "group" is a reserved word in SQL
  defaultWeight: numeric('default_weight', { precision: 6, scale: 1 }).notNull().default('0'),
  defaultReps: integer('default_reps').notNull().default(10),
  // Every movement belongs to exactly one user, seeded copies included, so the
  // whole library is theirs to rename, retune or delete.
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // Set when a movement is retired while logged history still references it:
  // hidden from the picker, but the FK from workout_exercises stays intact.
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [
  // Archived rows keep their name in logged history but must not block a new
  // movement reusing it, so the constraint covers live rows only.
  uniqueIndex('movements_user_name_key')
    .on(t.userId, sql`lower(${t.name})`)
    .where(sql`${t.archivedAt} is null`),
  index('movements_user_idx').on(t.userId, t.muscleGroup),
  check('movements_group_check', sql`${t.muscleGroup} in ('chest','back','shoulders','arms','legs','core')`),
]);

/* ── routines ────────────────────────────────────────────────────── */

const routines = pgTable('routines', {
  id: id(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  note: text('note').notNull().default(''),
  isStarter: boolean('is_starter').notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index('routines_user_idx').on(t.userId, t.createdAt)]);

const routineExercises = pgTable('routine_exercises', {
  id: id(),
  routineId: uuid('routine_id').notNull().references(() => routines.id, { onDelete: 'cascade' }),
  // restrict: a movement that a routine references must not vanish underneath it.
  movementId: uuid('movement_id').notNull().references(() => movements.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  sets: integer('sets').notNull().default(3),
  weight: numeric('weight', { precision: 6, scale: 1 }).notNull().default('0'),
  reps: integer('reps').notNull().default(10),
  position: integer('position').notNull(),
}, (t) => [
  uniqueIndex('routine_exercises_position_key').on(t.routineId, t.position),
  check('routine_exercises_sets_check', sql`${t.sets} between 1 and 20`),
]);

/* ── workouts ────────────────────────────────────────────────────── */

const workouts = pgTable('workouts', {
  id: id(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull().default('Quick Workout'),
  // A deleted routine should not take its logged history with it.
  routineId: uuid('routine_id').references(() => routines.id, { onDelete: 'set null' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }).notNull(),
  duration: integer('duration').notNull().default(0),
  // Denormalised so history and progress views avoid re-aggregating every set.
  totalSets: integer('total_sets').notNull().default(0),
  volume: integer('volume').notNull().default(0),
  createdAt: createdAt(),
}, (t) => [index('workouts_user_started_idx').on(t.userId, t.startedAt)]);

const workoutExercises = pgTable('workout_exercises', {
  id: id(),
  workoutId: uuid('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
  movementId: uuid('movement_id').notNull().references(() => movements.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  position: integer('position').notNull(),
}, (t) => [
  uniqueIndex('workout_exercises_position_key').on(t.workoutId, t.position),
  index('workout_exercises_movement_idx').on(t.movementId),
]);

const workoutSets = pgTable('workout_sets', {
  id: id(),
  workoutExerciseId: uuid('workout_exercise_id').notNull()
    .references(() => workoutExercises.id, { onDelete: 'cascade' }),
  weight: numeric('weight', { precision: 6, scale: 1 }).notNull(),
  reps: integer('reps').notNull(),
  position: integer('position').notNull(),
}, (t) => [
  uniqueIndex('workout_sets_position_key').on(t.workoutExerciseId, t.position),
  check('workout_sets_reps_check', sql`${t.reps} >= 0`),
  check('workout_sets_weight_check', sql`${t.weight} >= 0`),
]);

/* ── weights ─────────────────────────────────────────────────────── */

const weights = pgTable('weights', {
  id: id(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  kg: numeric('kg', { precision: 5, scale: 2 }).notNull(),
  // A calendar day, not an instant — no timezone ambiguity, and the unique
  // constraint below is the one v1 was missing. Mode 'string' keeps it as
  // 'YYYY-MM-DD', exactly what utils/dates.dayKey() produces.
  date: date('date', { mode: 'string' }).notNull(),
  createdAt: createdAt(),
}, (t) => [
  uniqueIndex('weights_user_date_key').on(t.userId, t.date),
  check('weights_kg_check', sql`${t.kg} > 0 and ${t.kg} <= 700`),
]);

/* ── nutrition ───────────────────────────────────────────────────── */

const meals = pgTable('meals', {
  id: id(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  calories: integer('calories').notNull(),
  protein: macro('protein'),
  carbs: macro('carbs'),
  fat: macro('fat'),
  // Only ever rendered with its meal, never filtered on.
  ingredients: jsonb('ingredients').notNull().default(sql`'[]'::jsonb`),
  source: text('source').notNull().default('manual'),
  date: date('date', { mode: 'string' }).notNull(),
  loggedAt: timestamp('logged_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('meals_user_date_idx').on(t.userId, t.date),
  check('meals_source_check', sql`${t.source} in ('manual','quick','ai')`),
  check('meals_calories_check', sql`${t.calories} >= 0`),
]);

const dishes = pgTable('dishes', {
  id: id(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  calories: integer('calories').notNull(),
  protein: macro('protein'),
  carbs: macro('carbs'),
  fat: macro('fat'),
  ingredients: jsonb('ingredients').notNull().default(sql`'[]'::jsonb`),
  useCount: integer('use_count').notNull().default(1),
  lastUsed: timestamp('last_used', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('dishes_user_slug_key').on(t.userId, t.slug),
  index('dishes_user_recent_idx').on(t.userId, t.lastUsed),
]);

/* ── relations ───────────────────────────────────────────────────── */

const routinesRelations = relations(routines, ({ many }) => ({ exercises: many(routineExercises) }));
const routineExercisesRelations = relations(routineExercises, ({ one }) => ({
  routine: one(routines, { fields: [routineExercises.routineId], references: [routines.id] }),
}));
const workoutsRelations = relations(workouts, ({ many }) => ({ exercises: many(workoutExercises) }));
const workoutExercisesRelations = relations(workoutExercises, ({ one, many }) => ({
  workout: one(workouts, { fields: [workoutExercises.workoutId], references: [workouts.id] }),
  sets: many(workoutSets),
}));
const workoutSetsRelations = relations(workoutSets, ({ one }) => ({
  exercise: one(workoutExercises, {
    fields: [workoutSets.workoutExerciseId], references: [workoutExercises.id],
  }),
}));

module.exports = {
  users, movements, routines, routineExercises,
  workouts, workoutExercises, workoutSets,
  weights, meals, dishes,
  routinesRelations, routineExercisesRelations,
  workoutsRelations, workoutExercisesRelations, workoutSetsRelations,
  MUSCLE_GROUPS,
};
