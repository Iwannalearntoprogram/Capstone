const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

// ✅ Register route
router.post("/register", async (req, res) => {
  // Destructure incoming fields from frontend
  const { firstName, lastName, username, email, password, phoneNumber, role } =
    req.body;

  try {
    // Check if email already exists
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "Email already in use" });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName: `${firstName} ${lastName}`,
      username,
      email,
      password: hashedPassword,
      phoneNumber,
      userType: role || "client",
    });

    await newUser.save();

    res
      .status(201)
      .json({ message: `${newUser.userType} registered successfully` });
  } catch (err) {
    // Handle unexpected server error
    res.status(500).json({ error: err.message });
  }
});

//OTP Route
//send OTP
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).send("User not found");

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    user.otp = otp;
    user.otpExpiresAt = otpExpiry;
    await user.save();

    await sendEmail(email, otp);
    res.status(200).send("OTP sent");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// verify otp
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).send("User not found");

    const now = new Date();
    if (user.otp !== otp || user.otpExpiresAt < now) {
      return res.status(400).send("Invalid or expired OTP");
    }

    user.emailVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    res.status(200).send("Email verified successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.userType }, 
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.userType,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

  router.post("/test", (req, res) => {
    res.send("Test endpoint working!");
  });
});

module.exports = router;
