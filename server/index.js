const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const movementRoutes = require('./routes/movementRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const weightRoutes = require('./routes/weightRoutes');
const mealRoutes = require('./routes/mealRoutes');

const app = express();

app.use(cors());
app.use(express.json());
// Routes
app.get('/', (req, res) => res.send('Welcome to gym tracker'));
app.get('/api/ping', (req, res) => res.send('pong'));

// Create specific route handlers that connect to DB
const dbMiddleware = async (req, res, next) => {
  await connectDB();
  next();
};

app.use('/api', dbMiddleware, authRoutes);
app.use('/api/movements', dbMiddleware, movementRoutes);
app.use('/api/workouts', dbMiddleware, workoutRoutes);
app.use('/api/weights', dbMiddleware, weightRoutes);
app.use('/api/meals', dbMiddleware, mealRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gymtracker';

// MongoDB connection logic
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(MONGO_URI);
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

// For local development
if (process.env.NODE_ENV !== 'production') {
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  });
}

module.exports = app;
