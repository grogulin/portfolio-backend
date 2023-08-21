// routes/signupRoutes.js

const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const router = express.Router();
const sequelize = require('../config/database'); // Import your Sequelize instance

router.post('/signup', async (req, res, next) => {
  res.status(403);
  // const transaction = await sequelize.transaction(); // Start a transaction

  // try {
  //   const { username, password } = req.body;
  //   const hashedPassword = await bcrypt.hash(password, 10);

  //   // Create a new user within the transaction
  //   await User.create({ username, password: hashedPassword }, { transaction });

  //   await transaction.commit(); // Commit the transaction

  //   res.status(201).json({ message: 'User registered successfully' });
  // } catch (error) {
  //   await transaction.rollback(); // Rollback the transaction in case of an error
  //   res.status(500).json({ error: error});
  // }
});

module.exports = router;
