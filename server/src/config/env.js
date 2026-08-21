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
  // Single-user deployment by default: the signup endpoint is off unless this
  // is explicitly turned on. Accounts are made with `npm run user:add`.
  allowRegistration: process.env.ALLOW_REGISTRATION === 'true',
};

env.isProduction = env.nodeEnv === 'production';
// Vercel and friends set this. Connection pooling has to behave differently
// where each request may land in its own short-lived process.
env.isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
env.hasAI = Boolean(env.geminiApiKey);

if (env.isProduction && env.corsOrigins.includes('*')) {
  // Not fatal — a public read-only deploy may genuinely want this — but with
  // `credentials: true` it means any site can call the API with the user's
  // token attached, so it should be a deliberate choice rather than a default.
  console.warn('[env] CORS_ORIGINS is "*" in production; set it to your client origin.');
}

module.exports = env;
