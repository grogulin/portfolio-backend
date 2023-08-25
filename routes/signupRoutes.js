// routes/signupRoutes.js

const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const router = express.Router();
const sequelize = require('../config/database');
const jwt = require('jsonwebtoken');
require('dotenv').config();

router.post('/login', async (req, res, next) => {
  try {

    const { username, password } = req.body;

    // return error if username or password are null
    if(!username || !password) {
      return res.status(401).json({ message: 'Malformed or Corrupted Request: Missing Username or Password' });
    }

    const user = await User.findOne({ where: { username } });

    // return error if username wasn't found
    if (!user) {
      return res.status(401).json({ message: 'Invalid username. Please check your username and try again' });
    }

    // Hash the provided password with the user's salt and compare it with the stored hash
    const hashedPassword = bcrypt.hashSync(password, user.password_salt);

    if (hashedPassword === user.password_salt) {
      // Successful login
      // creating and sending JWT token with timeout
      const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
      res.status(200).json({ token });
    } else {
      // Incorrect password
      return res.status(401).json({ message: 'Incorrect password. Please check your password and try again' });
    }
    
  } catch (error) {
    res.status(500).json({ message: 'Internal server error'});
  }
});

router.post('/signup', async (req, res, next) => {

  // On PROD env adding new admins should be disabled
  if (process.env.DISABLE_NEW_USERS === "true") {
    res.status(403).json({ message: 'New CMS admins registration is disabled.' });
  } else {

    const { username, password } = req.body;
    const transaction = await sequelize.transaction(); // Start a transaction

    try {

      // Create a new user within the transaction
      await User.create({ username, password: password }, { transaction });

      await transaction.commit(); // Commit the transaction

      res.status(201).json({ message: 'User registered successfully' });
    } catch (e) {
      await transaction.rollback();
      if (e.errors && e.errors.length === 1) {
        const error = e.errors[0]
        const field = error.path;
        switch (error.type) {
          case 'unique violation':
            return res.status(400).json({ message: `${field} must be unique` });
          case 'Validation error':
            return res.status(400).json({ message: error.message });
          case 'notNull Violation':
            return res.status(400).json({ message: `${field} cannot be null` });
        }
      } else {
          return res.status(500).json({ message: e});
      }
    }
  }
});

module.exports = router;
