/**
 * Applies the SQL files in drizzle/ to the target database.
 *
 * Uses drizzle-orm's runtime migrator rather than drizzle-kit, so this works in
 * the production image where devDependencies are not installed. Drizzle records
 * what it has applied, so running it on every boot is a no-op once up to date.
 */
const path = require('path');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const { db, closeDB } = require('../db');

const migrationsFolder = path.resolve(__dirname, '../../drizzle');

const applyMigrations = () => migrate(db, { migrationsFolder });

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
