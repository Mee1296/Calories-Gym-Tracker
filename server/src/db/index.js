const postgres = require('postgres');
const { drizzle } = require('drizzle-orm/postgres-js');
const schema = require('./schema');
const env = require('../config/env');

/**
 * One pooled connection for the process.
 *
 * Supabase's *transaction* pooler (port 6543) hands a different backend to each
 * statement, so prepared statements cannot be reused there and must be off.
 * Everywhere else — a direct connection, or the session pooler on 5432 — they
 * must be ON: without them postgres.js needs a second round trip to describe
 * the parameters of every query, which doubles the latency of literally every
 * call. Detect the pooler by port rather than hardcoding either answer.
 */
const usesTransactionPooler = (url) => {
  try {
    return new URL(url).port === '6543';
  } catch {
    return false;
  }
};

let client = null;
let database = null;

const getClient = () => {
  if (!client) {
    client = postgres(env.databaseUrl, {
      max: env.dbPoolSize,
      // Reconnecting to Supabase costs a TCP + TLS + auth handshake — around
      // 1.4s from here. This app is used in short bursts, so an idle timeout
      // meant almost every visit paid it. Hold connections open instead and
      // let the heartbeat below keep the pooler from reaping them.
      idle_timeout: 0,
      max_lifetime: 60 * 30,
      connect_timeout: 15,
      prepare: !usesTransactionPooler(env.databaseUrl),
      onnotice: () => {},
    });
  }
  return client;
};

/**
 * drizzle-orm runs every query through postgres.js's `unsafe()`, which forces
 * `prepare: false` regardless of the pool setting. That costs a second round
 * trip on each call — one to describe the parameters, one to bind and execute —
 * which against a remote pooler roughly doubles the latency of the whole API.
 * Re-enable preparation for that path, unless the transaction pooler is in use.
 */
const withPreparedUnsafe = (sql) => {
  if (!sql.options.prepare) return sql;
  return new Proxy(sql, {
    apply: (target, thisArg, args) => Reflect.apply(target, thisArg, args),
    get: (target, prop) => {
      if (prop === 'unsafe') {
        return (string, args = [], options = {}) =>
          target.unsafe(string, args, { prepare: true, ...options });
      }
      const value = target[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
};

const db = new Proxy({}, {
  get(_target, prop) {
    if (!database) database = drizzle(withPreparedUnsafe(getClient()), { schema });
    return database[prop];
  },
});

/** Verifies the connection is usable; called once on boot. */
const connectDB = async () => {
  await getClient()`select 1`;
  startHeartbeat();
  return db;
};

/**
 * Keeps one connection warm so the first request after a quiet spell does not
 * pay the reconnect. Unref'd, so it never holds the process open.
 */
let heartbeat = null;

const startHeartbeat = () => {
  if (heartbeat) return;
  heartbeat = setInterval(() => {
    getClient()`select 1`.catch(() => {});
  }, 60_000);
  heartbeat.unref?.();
};

const stopHeartbeat = () => {
  if (heartbeat) clearInterval(heartbeat);
  heartbeat = null;
};

const closeDB = async () => {
  stopHeartbeat();
  if (client) {
    await client.end({ timeout: 5 });
    client = null;
    database = null;
  }
};

module.exports = { db, connectDB, closeDB, getClient, schema };
