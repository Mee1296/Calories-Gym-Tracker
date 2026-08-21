/* Seeds one user's starting movement library. Idempotent — skips names they already have. */
const { eq } = require('drizzle-orm');
const { db, closeDB } = require('../db');
const { movements, users } = require('../db/schema');
const { MOVEMENTS } = require('../config/library');

/**
 * Gives `userId` any starter movement they are missing. Every movement is
 * user-owned, so this runs once per account at signup rather than globally.
 */
const seedMovementsFor = async (userId, tx = db) => {
  const existing = await tx.select({ name: movements.name })
    .from(movements).where(eq(movements.userId, userId));
  const taken = new Set(existing.map((row) => row.name.toLowerCase()));

  const toInsert = MOVEMENTS
    .filter((m) => !taken.has(m.name.toLowerCase()))
    .map((m) => ({
      name: m.name,
      muscleGroup: m.group,
      defaultWeight: String(m.defaultWeight),
      defaultReps: m.defaultReps,
      userId,
    }));

  if (toInsert.length) await tx.insert(movements).values(toInsert);
  return toInsert.length;
};

/** Backfills every existing account; safe to re-run. */
const seedAllUsers = async () => {
  const all = await db.select({ id: users.id, username: users.username }).from(users);
  const report = [];
  for (const user of all) {
    report.push({ username: user.username, added: await seedMovementsFor(user.id) });
  }
  return report;
};

module.exports = { seedMovementsFor, seedAllUsers };

if (require.main === module) {
  seedAllUsers()
    .then((report) => {
      for (const row of report) console.log(`${row.username}: ${row.added} added`);
      return closeDB();
    })
    .catch(async (err) => {
      console.error('Seed failed:', err);
      await closeDB().catch(() => {});
      process.exit(1);
    });
}
