const mongoose = require('mongoose');

const MovementSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String, enum: ['chest', 'back', 'arm', 'delts', 'legs', 'abs'], required: true },
  plane: { type: String, enum: ['frontal plane', 'saggital plane', 'transverse plane'], required: true }
});

module.exports = mongoose.model('Movement', MovementSchema);
