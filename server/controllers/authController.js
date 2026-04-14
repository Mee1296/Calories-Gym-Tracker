const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).send('Username and password are required');
    const user = new User({ username, password, role });
    await user.save();
    res.status(201).send('User registered');
  } catch (err) {
    if (err.code === 11000) return res.status(400).send('Username already exists');
    res.status(400).send(err.message);
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Username and password are required');
    
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).send('Invalid credentials');
    }
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
    res.json({ token, role: user.role });
  } catch (err) {
    res.status(400).send(err.message);
  }
};
