const { and, asc, desc, eq, inArray } = require('drizzle-orm');
const { db } = require('../db');
const { routines, routineExercises } = require('../db/schema');
const serialize = require('../db/serialize');
const movementService = require('./movementService');
const { STARTER_ROUTINES, GROUP_LABELS } = require('../config/library');
const ApiError = require('../utils/ApiError');
const { toPositive, toInt } = require('../utils/numbers');

const noteFromGroups = (list) => {
  const groups = [...new Set(list.map((m) => GROUP_LABELS[m.muscleGroup]).filter(Boolean))];
  return groups.length ? groups.join(' · ') : 'Custom routine';
};

/** Validates against movements this user can see and denormalises name + note. */
const buildExercises = async (userId, exercises) => {
  if (!Array.isArray(exercises) || exercises.length === 0) {
    throw ApiError.badRequest('A routine needs at least one movement');
  }

  const byId = await movementService.mapByIds(userId, exercises.map((e) => e.movementId));
  const resolved = exercises.map((entry, position) => {
    const movement = byId.get(String(entry.movementId));
    if (!movement) throw ApiError.badRequest(`Unknown movement: ${entry.movementId}`);
    return {
      movementId: movement.id,
      name: movement.name,
      muscleGroup: movement.muscleGroup,
      sets: Math.min(20, Math.max(1, toInt(entry.sets ?? 3, 3))),
      weight: String(toPositive(entry.weight ?? movement.defaultWeight)),
      reps: toInt(entry.reps ?? movement.defaultReps, movement.defaultReps),
      position,
    };
  });

  return { note: noteFromGroups(resolved), exercises: resolved };
};

const withExercises = async (routineRows) => {
  if (routineRows.length === 0) return [];
  const rows = await db.select().from(routineExercises)
    .where(inArray(routineExercises.routineId, routineRows.map((r) => r.id)))
    .orderBy(asc(routineExercises.position));

  const byRoutine = new Map(routineRows.map((r) => [r.id, []]));
  for (const row of rows) byRoutine.get(row.routineId)?.push(row);
  return routineRows.map((r) => serialize.routine(r, byRoutine.get(r.id)));
};

const list = async (userId) => {
  const rows = await db.select().from(routines)
    .where(eq(routines.userId, userId))
    // The starter routines are inserted in one statement and so share a
    // createdAt. Without the id tiebreak the sort is arbitrary among them, and
    // editing one visibly reshuffles the list.
    .orderBy(desc(routines.isStarter), asc(routines.createdAt), asc(routines.id));
  return withExercises(rows);
};

const insertExercises = (tx, routineId, exercises) =>
  tx.insert(routineExercises).values(exercises.map(({ muscleGroup, ...e }) => ({ ...e, routineId })));

const create = async (userId, { name, exercises }) => {
  if (!name?.trim()) throw ApiError.badRequest('Routine name is required');
  const built = await buildExercises(userId, exercises);

  return db.transaction(async (tx) => {
    const [routine] = await tx.insert(routines)
      .values({ userId, name: name.trim(), note: built.note })
      .returning();
    await insertExercises(tx, routine.id, built.exercises);
    return serialize.routine(routine, built.exercises);
  });
};

const update = async (userId, routineId, { name, exercises }) => {
  const [existing] = await db.select().from(routines)
    .where(and(eq(routines.id, routineId), eq(routines.userId, userId))).limit(1);
  if (!existing) throw ApiError.notFound('Routine not found');

  const built = exercises ? await buildExercises(userId, exercises) : null;

  return db.transaction(async (tx) => {
    const [routine] = await tx.update(routines).set({
      ...(name?.trim() ? { name: name.trim() } : {}),
      ...(built ? { note: built.note } : {}),
      updatedAt: new Date(),
    }).where(eq(routines.id, routineId)).returning();

    if (built) {
      await tx.delete(routineExercises).where(eq(routineExercises.routineId, routineId));
      await insertExercises(tx, routineId, built.exercises);
    }

    const current = built ? built.exercises : await tx.select().from(routineExercises)
      .where(eq(routineExercises.routineId, routineId)).orderBy(asc(routineExercises.position));
    return serialize.routine(routine, current);
  });
};

const remove = async (userId, routineId) => {
  const [row] = await db.delete(routines)
    .where(and(eq(routines.id, routineId), eq(routines.userId, userId)))
    .returning();
  if (!row) throw ApiError.notFound('Routine not found');
  return row;
};

/**
 * Gives a new account the starter Push/Pull/Legs routines.
 *
 * Batched into two inserts rather than two per routine: signup happens over a
 * remote connection, so round trips dominate the time the user waits.
 */
const seedStarters = async (userId, tx = db) => {
  const all = await movementService.listForUser(userId, tx);
  const byName = new Map(all.map((m) => [m.name, m]));

  const planned = STARTER_ROUTINES
    .map((starter) => {
      const exercises = starter.exercises
        .map((e) => {
          const movement = byName.get(e.name);
          if (!movement) return null;
          return {
            movementId: movement._id,
            name: movement.name,
            muscleGroup: movement.group,
            sets: e.sets,
            weight: String(e.weight),
            reps: e.reps,
          };
        })
        .filter(Boolean)
        .map((e, position) => ({ ...e, position }));

      return exercises.length ? { name: starter.name, exercises } : null;
    })
    .filter(Boolean);

  if (planned.length === 0) return [];

  const created = await tx.insert(routines).values(
    planned.map((p) => ({ userId, name: p.name, isStarter: true, note: noteFromGroups(p.exercises) })),
  ).returning();

  // Match on name rather than trusting the order rows come back in.
  const idByName = new Map(created.map((r) => [r.name, r.id]));
  const exerciseRows = planned.flatMap((p) =>
    p.exercises.map(({ muscleGroup, ...e }) => ({ ...e, routineId: idByName.get(p.name) })));

  if (exerciseRows.length) await tx.insert(routineExercises).values(exerciseRows);
  return created;
};

module.exports = { list, create, update, remove, seedStarters };
