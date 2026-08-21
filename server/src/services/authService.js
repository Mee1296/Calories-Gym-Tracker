const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { eq, sql } = require('drizzle-orm');
const { db } = require('../db');
const { users } = require('../db/schema');
const serialize = require('../db/serialize');
const routineService = require('./routineService');
const { seedMovementsFor } = require('../scripts/seed');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const signToken = (row) =>
  jwt.sign({ id: row.id, role: row.role, username: row.username }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

const findByUsername = async (username) => {
  const [row] = await db.select().from(users)
    .where(sql`lower(${users.username}) = lower(${username})`)
    .limit(1);
  return row || null;
};

const register = async ({ username, password }) => {
  if (!username?.trim() || !password) throw ApiError.badRequest('Username and password are required');
  if (password.length < 8) throw ApiError.badRequest('Password must be at least 8 characters');

  if (await findByUsername(username.trim())) throw ApiError.conflict('That username is already taken');

  const passwordHash = await bcrypt.hash(password, 10);

  const row = await db.transaction(async (tx) => {
    const [created] = await tx.insert(users).values({
      username: username.trim(),
      passwordHash,
      // Self-service admin signup is not allowed; promote in the database instead.
      role: 'user',
    }).returning();
    // Starters are built by looking movements up by name, so seed those first.
    await seedMovementsFor(created.id, tx);
    await routineService.seedStarters(created.id, tx);
    return created;
  });

  return { token: signToken(row), user: serialize.user(row) };
};

const login = async ({ username, password }) => {
  if (!username?.trim() || !password) throw ApiError.badRequest('Username and password are required');

  const row = await findByUsername(username.trim());
  if (!row || !(await bcrypt.compare(password, row.passwordHash))) {
    throw ApiError.unauthorized('Invalid username or password');
  }
  return { token: signToken(row), user: serialize.user(row) };
};

const getProfile = async (userId) => {
  const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!row) throw ApiError.notFound('User not found');
  return serialize.user(row);
};

module.exports = { register, login, getProfile, signToken };
