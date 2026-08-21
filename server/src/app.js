const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Behind Vercel / a reverse proxy, so req.ip reflects the client rather than
// the proxy — rate limiting below depends on that being right.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// The API serves JSON to a separate origin and embeds nothing, so the
// browser-facing policies helmet enables by default are not the useful part;
// the transport and sniffing headers are.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  hsts: env.isProduction ? { maxAge: 15552000, includeSubDomains: true } : false,
}));

// Meal and movement lists are repetitive JSON and compress well; on a remote
// database the transfer is small next to query time, but it is free.
app.use(compression());

app.use(cors({
  origin: env.corsOrigins.includes('*') ? true : env.corsOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '256kb' }));

app.get('/', (req, res) => res.json({ name: 'Stride API', version: 2 }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
