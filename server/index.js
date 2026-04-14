const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const movementRoutes = require('./routes/movementRoutes');
const workoutRoutes = require('./routes/workoutRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.get('/api/ping', (req, res) => res.send('pong'));
app.use('/api', authRoutes);
app.use('/api/movements', movementRoutes);
app.use('/api/workouts', workoutRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gymtracker';

// MongoDB connection logic for serverless
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    const db = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = db.connections[0].readyState;
    console.log('Connected to MongoDB');
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

// Ensure DB is connected for every request in serverless
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

module.exports = app;
