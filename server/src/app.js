const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1);
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
