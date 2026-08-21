const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const required = (key, fallback) => {
  const value = process.env[key] || fallback;
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  databaseUrl: required('DATABASE_URL', 'postgresql://stride:stride-local-dev@localhost:5432/stride'),
  dbPoolSize: Number(process.env.DB_POOL_SIZE || 10),
  // Only used by the one-off Mongo -> Postgres migration script.
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: required('JWT_SECRET', process.env.NODE_ENV === 'production' ? '' : 'dev-only-insecure-secret'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  corsOrigins: (process.env.CORS_ORIGINS || '*').split(',').map((s) => s.trim()),
};

env.isProduction = env.nodeEnv === 'production';
env.hasAI = Boolean(env.geminiApiKey);

module.exports = env;
