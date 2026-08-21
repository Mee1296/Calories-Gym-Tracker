const { and, eq, isNull, sql, inArray, asc, count } = require('drizzle-orm');
const { db } = require('../db');
const { movements, routines, routineExercises, workoutExercises, MUSCLE_GROUPS } = require('../db/schema');
const serialize = require('../db/serialize');
const ApiError = require('../utils/ApiError');
const { toPositive, toInt } = require('../utils/numbers');

/** Every movement is owned; archived ones stay out of the picker. */
const visibleTo = (userId) => and(eq(movements.userId, userId), isNull(movements.archivedAt));

const listForUser = async (userId, tx = db) => {
  const rows = await tx.select().from(movements)
    .where(visibleTo(userId))
    .orderBy(asc(movements.muscleGroup), asc(movements.name));
  return rows.map(serialize.movement);
};

const findForUser = async (userId, movementId) => {
  const [row] = await db.select().from(movements)
    .where(and(eq(movements.id, movementId), visibleTo(userId)))
    .limit(1);
  if (!row) throw ApiError.notFound('Movement not found');
  return row;
};

/** Resolves many ids in one query; returns a Map keyed by id. */
const mapByIds = async (userId, ids, tx = db) => {
  const unique = [...new Set(ids.filter(Boolean).map(String))];
  if (unique.length === 0) return new Map();
  const rows = await tx.select().from(movements)
    .where(and(inArray(movements.id, unique), eq(movements.userId, userId)));
  return new Map(rows.map((row) => [row.id, row]));
};

/** Rejects a name already in this user's library, ignoring `exceptId` when editing. */
const assertNameFree = async (userId, name, exceptId = null, tx = db) => {
  const clashes = await tx.select({ id: movements.id }).from(movements)
    .where(and(
      eq(movements.userId, userId),
      sql`lower(${movements.name}) = ${name.toLowerCase()}`,
      isNull(movements.archivedAt),
    ));
  if (clashes.some((row) => row.id !== exceptId)) {
    throw ApiError.conflict(`“${name}” is already in your movements`);
  }
};

const cleanName = (name) => {
  const trimmed = name?.trim();
  if (!trimmed) throw ApiError.badRequest('Movement name is required');
  return trimmed;
};

const cleanGroup = (group) => {
  if (!MUSCLE_GROUPS.includes(group)) {
    throw ApiError.badRequest(`Group must be one of: ${MUSCLE_GROUPS.join(', ')}`);
  }
  return group;
};

const create = async ({ name, group, defaultWeight, defaultReps }, { userId }) => {
  const trimmed = cleanName(name);
  cleanGroup(group);
  await assertNameFree(userId, trimmed);

  const [row] = await db.insert(movements).values({
    name: trimmed,
    muscleGroup: group,
    defaultWeight: String(toPositive(defaultWeight ?? 0)),
    defaultReps: toInt(defaultReps ?? 10),
    userId,
  }).returning();

  return serialize.movement(row);
};

/** Partial update — only the keys present in `patch` are touched. */
const update = async (userId, movementId, patch) => {
  const current = await findForUser(userId, movementId);
  const values = {};

  if (patch.name !== undefined) {
    values.name = cleanName(patch.name);
    if (values.name.toLowerCase() !== current.name.toLowerCase()) {
      await assertNameFree(userId, values.name, movementId);
    }
  }
  if (patch.group !== undefined) values.muscleGroup = cleanGroup(patch.group);
  if (patch.defaultWeight !== undefined) values.defaultWeight = String(toPositive(patch.defaultWeight));
  if (patch.defaultReps !== undefined) values.defaultReps = toInt(patch.defaultReps);

  if (Object.keys(values).length === 0) return serialize.movement(current);

  const [row] = await db.update(movements).set(values)
    .where(and(eq(movements.id, movementId), eq(movements.userId, userId)))
    .returning();

  // Routines keep their own copy of the name for display, so follow a rename.
  if (values.name) {
    const owned = db.select({ id: routines.id }).from(routines).where(eq(routines.userId, userId));
    await db.update(routineExercises).set({ name: values.name })
      .where(and(
        eq(routineExercises.movementId, movementId),
        inArray(routineExercises.routineId, owned),
      ));
  }

  return serialize.movement(row);
};

/** What a delete would disturb, so the UI can warn before asking. */
const usage = async (userId, movementId) => {
  await findForUser(userId, movementId);

  const [inRoutines, logged] = await Promise.all([
    db.select({ name: routines.name }).from(routineExercises)
      .innerJoin(routines, eq(routines.id, routineExercises.routineId))
      .where(and(eq(routineExercises.movementId, movementId), eq(routines.userId, userId))),
    db.select({ n: count() }).from(workoutExercises)
      .where(eq(workoutExercises.movementId, movementId)),
  ]);

  return {
    routines: [...new Set(inRoutines.map((r) => r.name))],
    loggedSessions: Number(logged[0]?.n ?? 0),
  };
};

/**
 * Removes a movement. It is dropped from any routine that used it, then either
 * deleted outright or - when logged history points at it - archived, so past
 * sessions keep their exercise rows.
 */
const remove = async (userId, movementId) => {
  await findForUser(userId, movementId);

  return db.transaction(async (tx) => {
    const affected = await tx.select({ routineId: routineExercises.routineId })
      .from(routineExercises)
      .innerJoin(routines, eq(routines.id, routineExercises.routineId))
      .where(and(eq(routineExercises.movementId, movementId), eq(routines.userId, userId)));
    const routineIds = [...new Set(affected.map((r) => r.routineId))];

    if (routineIds.length) {
      await tx.delete(routineExercises)
        .where(and(
          eq(routineExercises.movementId, movementId),
          inArray(routineExercises.routineId, routineIds),
        ));
      // `position` is unique per routine, so close the gaps left behind.
      for (const routineId of routineIds) {
        const rest = await tx.select({ id: routineExercises.id })
          .from(routineExercises)
          .where(eq(routineExercises.routineId, routineId))
          .orderBy(asc(routineExercises.position));
        for (let i = 0; i < rest.length; i += 1) {
          await tx.update(routineExercises)
            .set({ position: i })
            .where(eq(routineExercises.id, rest[i].id));
        }
      }
    }

    const logged = await tx.select({ n: count() }).from(workoutExercises)
      .where(eq(workoutExercises.movementId, movementId));
    const archived = Number(logged[0]?.n ?? 0) > 0;

    if (archived) {
      await tx.update(movements).set({ archivedAt: new Date() })
        .where(and(eq(movements.id, movementId), eq(movements.userId, userId)));
    } else {
      await tx.delete(movements)
        .where(and(eq(movements.id, movementId), eq(movements.userId, userId)));
    }

    return { archived, routinesUpdated: routineIds.length };
  });
};

module.exports = { listForUser, findForUser, mapByIds, create, update, remove, usage, visibleTo };
