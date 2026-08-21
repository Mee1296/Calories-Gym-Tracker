const app = require('./src/app');
const env = require('./src/config/env');
const { connectDB, closeDB } = require('./src/db');
const { applyMigrations } = require('./src/scripts/db-migrate');

if (require.main === module) {
  connectDB()
    .then(async () => {
      // Bring the schema up to date before anything touches a table.
      await applyMigrations();

      const server = app.listen(env.port, () =>
        console.log(`Stride API listening on :${env.port} (${env.nodeEnv})`));

      const shutdown = async (signal) => {
        console.log(`\n${signal} received, closing.`);
        server.close();
        await closeDB().catch(() => {});
        process.exit(0);
      };
      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));
    })
    .catch((err) => {
      console.error('Failed to start: could not reach Postgres.', err.message);
      process.exit(1);
    });
}

module.exports = app;
