/**
 * Creates or updates an account from the command line.
 *
 * Registration is closed on a single-user deployment, so this is how accounts
 * are made. Being an operator tool run against the database directly, it does
 * not apply the signup endpoint's password-length rule — the person running it
 * has already decided.
 *
 *   npm run user:add -- <username> <password> [--admin]
 *
 * Re-running for an existing username resets that account's password rather
 * than failing, which is also how you recover from forgetting it.
 */
const bcrypt = require('bcryptjs');
const { sql } = require('drizzle-orm');
const { db, closeDB } = require('../db');
const { users } = require('../db/schema');
const { seedMovementsFor } = require('./seed');
const routineService = require('../services/routineService');

const createOrUpdateUser = async ({ username, password, admin = false }) => {
  const name = username?.trim();
  if (!name) throw new Error('A username is required');
  if (!password) throw new Error('A password is required');

  const passwordHash = await bcrypt.hash(password, 10);

  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(users)
      .where(sql`lower(${users.username}) = lower(${name})`)
      .limit(1);

    if (existing) {
      await tx.update(users)
        .set({ passwordHash, ...(admin ? { role: 'admin' } : {}), updatedAt: new Date() })
        .where(sql`${users.id} = ${existing.id}`);
      return { username: existing.username, created: false };
    }

    const [created] = await tx.insert(users)
      .values({ username: name, passwordHash, role: admin ? 'admin' : 'user' })
      .returning();

    // Same starting point a signup would have given them.
    await seedMovementsFor(created.id, tx);
    await routineService.seedStarters(created.id, tx);
    return { username: created.username, created: true };
  });
};

module.exports = { createOrUpdateUser };

if (require.main === module) {
  const args = process.argv.slice(2);
  const admin = args.includes('--admin');
  const [username, password] = args.filter((a) => a !== '--admin');

  if (!username || !password) {
    console.error('Usage: npm run user:add -- <username> <password> [--admin]');
    process.exit(1);
  }

  createOrUpdateUser({ username, password, admin })
    .then(async (result) => {
      console.log(result.created
        ? `Created "${result.username}" with a seeded library and starter routines.`
        : `Updated the password for "${result.username}".`);
      await closeDB();
    })
    .catch(async (err) => {
      console.error('Failed:', err.message);
      await closeDB().catch(() => {});
      process.exit(1);
    });
}
