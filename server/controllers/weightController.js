const Weight = require('../models/Weight');

exports.logWeight = async (req, res) => {
  try {
    const { weight, date } = req.body;
    const entry = new Weight({
      userId: req.user.id,
      weight,
      date: date || new Date()
    });
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

exports.getWeightHistory = async (req, res) => {
  try {
    const history = await Weight.find({ userId: req.user.id }).sort({ date: 1 });
    res.json(history);
  } catch (err) {
    res.status(400).send(err.message);
  }
};
