/**
 * Applies the SQL files in drizzle/ to the target database.
 *
 * Uses drizzle-orm's runtime migrator rather than drizzle-kit, so this works in
 * the production image where devDependencies are not installed. Drizzle records
 * what it has applied, so running it on every boot is a no-op once up to date.
 */
const path = require('path');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const { db, getClient, closeDB } = require('../db');

const migrationsFolder = path.resolve(__dirname, '../../drizzle');

// Any 64-bit constant; it only has to be the same in every instance.
const LOCK_KEY = 4021977123456789n;

/**
 * Serialises migration across instances. Two containers booting together would
 * otherwise both see an empty migrations table and try to apply the same DDL,
 * and the loser fails on an already-existing object. Whoever gets the advisory
 * lock migrates; the others wait and then find nothing to do.
 */
const applyMigrations = async () => {
  const sql = getClient();
  await sql`select pg_advisory_lock(${LOCK_KEY})`;
  try {
    await migrate(db, { migrationsFolder });
  } finally {
    await sql`select pg_advisory_unlock(${LOCK_KEY})`;
  }
};

module.exports = { applyMigrations };

if (require.main === module) {
  applyMigrations()
    .then(() => { console.log('Schema migrations applied.'); return closeDB(); })
    .catch(async (err) => {
      console.error('Schema migration failed:', err.message);
      await closeDB().catch(() => {});
      process.exit(1);
    });
}
