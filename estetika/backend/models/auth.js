require('dotenv').config();

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const sendEmail = require('../services/sendEmail'); // adjust path as needed

//REGISTER
router.post('/register', async (req, res) => {
  try {
    const { firstname, lastname, email, username, password } = req.body;

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: 'Username already exists' });

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(409).json({ message: 'Email already used' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ firstname, lastname, email, username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully. Please log in to verify your email.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user using only the username
    const user = await User.findOne({ username });

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if email is verified
    if (!user.isVerified) {
      // Create verification token
      const verificationToken = jwt.sign({ id: user._id }, process.env.EMAIL_SECRET_KEY, { expiresIn: '1h' });

      // Construct verification link
      const baseUrl = process.env.NODE_ENV === 'production' ? process.env.PRODUCTION_URL : 'http://localhost:3001';
      const verificationLink = `${baseUrl}/auth/verify-email?token=${verificationToken}`;

      // Log for debugging
      console.log('Attempting to send verification email to:', user.email);

      // Construct the HTML email content
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Email Verification</h2>
          <p>Click the button below to verify your email address:</p>
          <a href="${verificationLink}" target="_blank" style="text-decoration: none;">
            <button style="padding: 10px 20px; background-color: #28a745; color: white; border: none; border-radius: 5px;">
              Verify Email
            </button>
          </a>
        </div>`;

      // Send the email with HTML content
      try {
        await sendEmail(user.email, 'Verify your email', `Verify your email: ${verificationLink}`, emailHtml);
      } catch (err) {
        return res.status(500).json({ message: 'Error sending verification email. Please try again later.' });
      }

      return res.status(400).json({ message: 'Please verify your email. A verification link has been sent to your email address.' });
    }

    // Continue login
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.status(200).json({ message: 'Login successful', token });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// VERIFY EMAIL (Updated for auto-login)
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    // Verify the token
    const decoded = jwt.verify(token, process.env.EMAIL_SECRET_KEY);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).json({ message: 'Invalid token or user not found' });
    }

    // Check if the email is already verified
    if (user.isVerified) {
      return res.status(200).json({ message: 'Email already verified!' });
    }

    // Mark the user as verified
    user.isVerified = true;
    await user.save();

    // Generate a JWT for auto-login after email verification
    const authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Respond with success message and auth token for auto-login
    res.status(200).json({ message: 'Email verified successfully!', authToken });

  } catch (err) {
    // Handle expired token error
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Token expired, please request a new verification email.' });
    }

    // Handle any other errors
    console.error('Error during email verification:', err);
    res.status(500).json({ message: 'Invalid or expired token' });
  }
});


// RESEND VERIFICATION EMAIL
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

    const token = jwt.sign({ id: user._id }, process.env.EMAIL_SECRET_KEY, { expiresIn: '1h' });

    // Set the base URL dynamically based on the environment
    const baseUrl = process.env.NODE_ENV === 'production' ? process.env.PRODUCTION_URL : 'http://localhost:3001';
    const verificationLink = `${baseUrl}/verify-email?token=${token}`;

    // Resend the verification email
    try {
      await sendEmail(user.email, 'Verify your email', `Click here to verify your email: ${verificationLink}`);
    } catch (err) {
      return res.status(500).json({ message: 'Error sending verification email. Please try again later.' });
    }

    res.status(200).json({ message: 'Verification email sent again.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
