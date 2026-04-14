const Movement = require('../models/Movement');

exports.getMovements = async (req, res) => {
  try {
    const movements = await Movement.find();
    res.json(movements);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.createMovement = async (req, res) => {
  try {
    const { name, category, plane } = req.body;
    const movement = new Movement({ name, category, plane });
    await movement.save();
    res.status(201).json(movement);
  } catch (err) {
    res.status(400).send(err.message);
  }
};
