const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { firstName, lastName, username, email, password, phoneNumber, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      phoneNumber,
      role: role || 'client'
    });

    await newUser.save();
    res.status(201).json({ message: `${newUser.role} registered successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
const authMiddleware = require('../middleware/authMiddleware'); // JWT middleware

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('username role');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
