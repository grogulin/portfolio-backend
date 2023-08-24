// routes/signupRoutes.js

const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const router = express.Router();
const sequelize = require('../config/database'); // Import your Sequelize instance
const jwt = require('jsonwebtoken');
require('dotenv').config();

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // return error if username or password are null
    if(!username || !password) {
      return res.status(401).json({ message: 'Malformed or Corrupted Request: Missing Username or Password.' });
    }

    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username. Please check your username and try again.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please check your password and try again.' });
    }

    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error'});
  }
});

router.post('/signup', async (req, res, next) => {
  if (process.env.DISABLE_NEW_USERS === "true") {
    // On PROD env adding new admins is disabled
    res.status(403).json({ message: 'New CMS admins registration is disabled.' });
  } else {
    const { username, password } = req.body;
    const transaction = await sequelize.transaction(); // Start a transaction

    try {

      // check length of username and password
      if (username.length < 5) {
        return res.status(400).json({ message: 'Username should consist of at least 5 characters.' });
      } else if (password.length > 25 || password.length < 5) {
        return res.status(400).json({ message: 'Password should be between 5-25 characters long.' });
      }

      
      const hashedPassword = await bcrypt.hash(password, 10);
      const existingUser = await User.findOne({ where: { username } });

      // Check if username is unique
      if (existingUser) {
        // User already exists
        return res.status(400).json({ message: 'Username already taken.' });
      }

      // Create a new user within the transaction
      await User.create({ username, password: hashedPassword }, { transaction });

      await transaction.commit(); // Commit the transaction

      res.status(201).json({ message: 'User registered successfully.' });
    } catch (error) {
      await transaction.rollback(); // Rollback the transaction in case of an error
      res.status(500).json({ message: error});
    }
  }
});

module.exports = router;
