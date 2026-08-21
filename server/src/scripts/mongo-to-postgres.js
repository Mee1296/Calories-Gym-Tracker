/**
 * Copies a MongoDB database into Postgres.
 *
 * Accepts either Mongo shape:
 *   v1 (Gym Tracker) — targetCalories, Movement.category, Weight.weight, startTime
 *   v2 (Stride/Mongo) — goals{}, Movement.group, Weight.kg, startedAt
 * so a v1 install migrates in one step rather than v1 -> v2 -> Postgres.
 *
 *   MONGO_URI=... DATABASE_URL=... npm run migrate
 *   npm run migrate -- --dry
 *
 * Re-runnable: it refuses to run against a non-empty Postgres unless --force is
 * given, because inserting twice would duplicate everything.
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const { sql } = require('drizzle-orm');
const { db, closeDB } = require('../db');
const {
  users, movements, routines, routineExercises,
  workouts, workoutExercises, workoutSets, weights, meals, dishes,
} = require('../db/schema');
const { seedAllUsers } = require('./seed');
const { dayKey } = require('../utils/dates');
const env = require('../config/env');

const GROUP_OF_CATEGORY = {
  chest: 'chest', back: 'back', arm: 'arms', delts: 'shoulders', legs: 'legs', abs: 'core',
};
const VALID_GROUPS = new Set(['chest', 'back', 'shoulders', 'arms', 'legs', 'core']);

const num = (value, fallback = 0) => (Number.isFinite(value) ? value : fallback);
const slugify = (name) => String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
const dec = (value, fallback = 0) => String(num(Number(value), fallback));

/** Maps each Mongo ObjectId to the uuid its Postgres row was given. */
const makeIdMap = () => {
  const map = new Map();
  return {
    set: (objectId, uuid) => map.set(String(objectId), uuid),
    get: (objectId) => map.get(String(objectId)) || null,
    has: (objectId) => map.has(String(objectId)),
    size: () => map.size,
  };
};

const run = async () => {
  const dryRun = process.argv.includes('--dry') || process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');

  if (!env.mongoUri) throw new Error('MONGO_URI is not set — nothing to migrate from.');

  const mongo = await MongoClient.connect(env.mongoUri);
  const src = mongo.db();
  const report = [];

  const [{ n: existingUsers }] = await db.select({ n: sql`count(*)::int`.as('n') }).from(users);
  if (existingUsers > 0 && !force && !dryRun) {
    throw new Error(
      `Postgres already has ${existingUsers} users. Re-running would duplicate data.\n`
      + 'Clear the target database first, or pass --force if you are sure.',
    );
  }

  console.log(`\nMongo -> Postgres — ${dryRun ? 'DRY RUN, nothing will be written' : 'copying'}`);
  console.log(`from: ${src.databaseName}\n`);

  /* ---- read everything up front ---- */
  const [srcUsers, srcMovements, srcRoutines, srcWorkouts, srcWeights, srcMeals, srcDishes] =
    await Promise.all([
      src.collection('users').find({}).toArray(),
      src.collection('movements').find({}).toArray(),
      src.collection('routines').find({}).toArray(),
      src.collection('workouts').find({}).toArray(),
      src.collection('weights').find({}).toArray(),
      src.collection('meals').find({}).toArray(),
      src.collection('dishes').find({}).toArray(),
    ]);

  if (dryRun) {
    console.log(`  users      ${srcUsers.length}`);
    console.log(`  movements  ${srcMovements.length}`);
    console.log(`  routines   ${srcRoutines.length}`);
    console.log(`  workouts   ${srcWorkouts.length}`);
    console.log(`  weights    ${srcWeights.length}  (duplicate days will be collapsed)`);
    console.log(`  meals      ${srcMeals.length}`);
    console.log(`  dishes     ${srcDishes.length}  (case variants will be merged)`);
    console.log('\nDry run complete. Re-run without --dry to apply.\n');
    await mongo.close();
    await closeDB();
    return;
  }

  const userIds = makeIdMap();
  const movementIds = makeIdMap();
  const routineIds = makeIdMap();

  await db.transaction(async (tx) => {
    /* ---- users ---- */
    for (const u of srcUsers) {
      const goals = u.goals || {};
      const profile = u.profile || {};
      const [row] = await tx.insert(users).values({
        username: u.username,
        // Already a bcrypt hash in both shapes; re-hash only if it is not one.
        passwordHash: /^\$2[aby]\$/.test(u.password || '')
          ? u.password
          : await bcrypt.hash(u.password || Math.random().toString(36), 10),
        role: u.role === 'admin' ? 'admin' : 'user',
        goalCalories: num(goals.calories ?? u.targetCalories, 2400),
        goalProtein: num(goals.protein ?? u.targetProtein, 160),
        goalCarbs: num(goals.carbs ?? u.targetCarbs, 250),
        goalFat: num(goals.fat ?? u.targetFat, 75),
        profileHeightCm: profile.heightCm ? dec(profile.heightCm) : null,
        profileAge: profile.age ?? null,
        profileGender: profile.gender ?? null,
        profileBodyFat: profile.bodyFat ? dec(profile.bodyFat) : null,
        profileActivityLevel: profile.activityLevel || 'moderately active',
        profileGoal: profile.goal || 'maintain',
        createdAt: u.createdAt || u._id.getTimestamp(),
      }).returning();
      userIds.set(u._id, row.id);
    }
    report.push(`users      ${userIds.size()} copied`);

    /* ---- movements ---- */
    // v3 has no shared library: every movement belongs to a user, so a v1
    // library row becomes one copy per user. `movementIds` maps a source id to
    // that user's copy, keyed `${userId}|${sourceId}`.
    const seenNames = new Set();
    const allUserIds = [...userIds.values()];
    for (const m of srcMovements) {
      const group = m.group || GROUP_OF_CATEGORY[m.category];
      const owners = m.userId ? [userIds.get(m.userId)].filter(Boolean) : allUserIds;

      for (const owner of owners) {
        const key = `${owner}|${slugify(m.name)}`;
        // The unique index is case-insensitive per user; skip collisions.
        if (seenNames.has(key)) continue;
        seenNames.add(key);

        const [row] = await tx.insert(movements).values({
          name: m.name,
          muscleGroup: VALID_GROUPS.has(group) ? group : 'core',
          defaultWeight: dec(m.defaultWeight, 0),
          defaultReps: num(m.defaultReps, 10),
          userId: owner,
        }).returning();
        movementIds.set(`${owner}|${m._id}`, row.id);
      }
    }
    report.push(`movements  ${movementIds.size} copied`);

    /* ---- routines ---- */
    let routineExerciseCount = 0;
    let droppedRoutineExercises = 0;
    for (const r of srcRoutines) {
      const owner = userIds.get(r.userId);
      if (!owner) continue;

      const [row] = await tx.insert(routines).values({
        userId: owner,
        name: r.name,
        note: r.note || '',
        isStarter: Boolean(r.isStarter),
        createdAt: r.createdAt || r._id.getTimestamp(),
      }).returning();
      routineIds.set(r._id, row.id);

      const resolved = (r.exercises || [])
        .filter((e) => {
          const ok = movementIds.has(`${owner}|${e.movementId}`);
          if (!ok) droppedRoutineExercises += 1;
          return ok;
        })
        .map((e, position) => ({
          routineId: row.id,
          movementId: movementIds.get(`${owner}|${e.movementId}`),
          name: e.name || 'Movement',
          sets: Math.min(20, Math.max(1, num(e.sets, 3))),
          weight: dec(e.weight, 0),
          reps: num(e.reps, 10),
          position,
        }));
      if (resolved.length) {
        await tx.insert(routineExercises).values(resolved);
        routineExerciseCount += resolved.length;
      }
    }
    report.push(`routines   ${routineIds.size()} copied, ${routineExerciseCount} exercises`
      + (droppedRoutineExercises ? `, ${droppedRoutineExercises} dropped (missing movement)` : ''));

    /* ---- workouts ---- */
    let exerciseCount = 0;
    let setCount = 0;
    let ghosted = 0;
    for (const w of srcWorkouts) {
      const owner = userIds.get(w.userId);
      if (!owner) continue;

      const startedAt = w.startedAt || w.startTime || w._id.getTimestamp();
      const duration = Number.isFinite(w.duration)
        ? w.duration
        : (w.endedAt || w.endTime
          ? Math.max(0, Math.round(((w.endedAt || w.endTime) - startedAt) / 1000))
          : 0);
      const endedAt = w.endedAt || w.endTime || new Date(startedAt.getTime() + duration * 1000);

      // Foreign keys mean an exercise pointing at a deleted movement cannot be
      // inserted; those are dropped and counted rather than failing the run.
      const usable = (w.exercises || []).filter((e) => {
        const ok = movementIds.has(`${owner}|${e.movementId}`);
        if (!ok) ghosted += 1;
        return ok;
      });

      const allSets = usable.flatMap((e) => e.sets || []);
      const [row] = await tx.insert(workouts).values({
        userId: owner,
        name: w.name || 'Workout',
        routineId: w.routineId ? routineIds.get(w.routineId) : null,
        startedAt,
        endedAt,
        duration,
        totalSets: allSets.length,
        volume: Math.round(allSets.reduce((a, s) => a + num(s.weight, 0) * num(s.reps, 0), 0)),
        createdAt: w.createdAt || startedAt,
      }).returning();

      for (const [position, e] of usable.entries()) {
        const [exercise] = await tx.insert(workoutExercises).values({
          workoutId: row.id,
          movementId: movementIds.get(`${owner}|${e.movementId}`),
          name: e.name || 'Movement',
          position,
        }).returning();
        exerciseCount += 1;

        const sets = (e.sets || []).map((s, i) => ({
          workoutExerciseId: exercise.id,
          weight: dec(s.weight, 0),
          reps: num(s.reps, 0),
          position: i,
        }));
        if (sets.length) {
          await tx.insert(workoutSets).values(sets);
          setCount += sets.length;
        }
      }
    }
    report.push(`workouts   ${srcWorkouts.length} copied, ${exerciseCount} exercises, ${setCount} sets`
      + (ghosted ? `, ${ghosted} dropped (movement no longer exists)` : ''));

    /* ---- weights: collapse duplicate days ---- */
    const weightByDay = new Map();
    for (const w of [...srcWeights].sort((a, b) => (a._id > b._id ? 1 : -1))) {
      const owner = userIds.get(w.userId);
      if (!owner) continue;
      weightByDay.set(`${owner}|${dayKey(w.date)}`, {
        userId: owner,
        kg: dec(w.kg ?? w.weight, 0),
        date: dayKey(w.date),
        createdAt: w.createdAt || w._id.getTimestamp(),
      });
    }
    const weightRows = [...weightByDay.values()].filter((r) => Number(r.kg) > 0);
    if (weightRows.length) await tx.insert(weights).values(weightRows);
    report.push(`weights    ${weightRows.length} copied`
      + (srcWeights.length - weightRows.length ? `, ${srcWeights.length - weightRows.length} duplicate days collapsed` : ''));

    /* ---- meals ---- */
    const mealRows = srcMeals
      .filter((m) => userIds.has(m.userId))
      .map((m) => ({
        userId: userIds.get(m.userId),
        name: m.name,
        calories: Math.round(num(m.calories, 0)),
        protein: Math.round(num(m.protein, 0)),
        carbs: Math.round(num(m.carbs, 0)),
        fat: Math.round(num(m.fat, 0)),
        ingredients: (m.ingredients || []).map((i) => (typeof i === 'string' ? { name: i } : i)),
        source: ['manual', 'quick', 'ai'].includes(m.source) ? m.source : 'manual',
        date: dayKey(m.date || m.createdAt || m._id.getTimestamp()),
        loggedAt: m.loggedAt || m.createdAt || m._id.getTimestamp(),
      }))
      .filter((m) => m.calories >= 0);
    if (mealRows.length) await tx.insert(meals).values(mealRows);
    report.push(`meals      ${mealRows.length} copied`);

    /* ---- dishes: merge case variants ---- */
    const dishBySlug = new Map();
    for (const d of [...srcDishes].sort((a, b) => (a.lastUsed || 0) - (b.lastUsed || 0))) {
      const owner = userIds.get(d.userId);
      if (!owner) continue;
      const key = `${owner}|${slugify(d.name)}`;
      const previous = dishBySlug.get(key);
      dishBySlug.set(key, {
        userId: owner,
        name: d.name,
        slug: slugify(d.name),
        calories: Math.round(num(d.calories, 0)),
        protein: Math.round(num(d.protein, 0)),
        carbs: Math.round(num(d.carbs, 0)),
        fat: Math.round(num(d.fat, 0)),
        ingredients: (d.ingredients || []).map((i) => (typeof i === 'string' ? i : i.name)).filter(Boolean),
        useCount: (previous?.useCount || 0) + num(d.useCount, 1),
        lastUsed: d.lastUsed || d._id.getTimestamp(),
      });
    }
    const dishRows = [...dishBySlug.values()];
    if (dishRows.length) await tx.insert(dishes).values(dishRows);
    report.push(`dishes     ${dishRows.length} copied`
      + (srcDishes.length - dishRows.length ? `, ${srcDishes.length - dishRows.length} case-variants merged` : ''));
  });

  // Give every account any starter movement the import did not supply.
  const seeded = await seedAllUsers();
  report.push(`library    ${seeded.reduce((n, r) => n + r.added, 0)} added across ${seeded.length} user(s)`);

  report.forEach((line) => console.log(`  ${line}`));
  console.log('\nMigration complete.\n');

  await mongo.close();
  await closeDB();
};

if (require.main === module) {
  run().catch(async (err) => {
    console.error('\nMigration failed:', err.message);
    console.error('The whole copy runs in one transaction, so Postgres is unchanged.');
    await closeDB().catch(() => {});
    process.exit(1);
  });
}

module.exports = { run };
