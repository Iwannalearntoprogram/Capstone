const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User/User");
const sendEmail = require("../../utils/sendEmail");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");

// ✅ Register route
const register = catchAsync(async (req, res, next) => {
  // Destructure incoming fields from frontend
  const { firstName, lastName, username, email, password, phoneNumber, role } =
    req.body;

  if (
    !firstName ||
    !lastName ||
    !username ||
    !email ||
    !password ||
    !phoneNumber
  ) {
    return next(new AppError("Please provide all required fields", 400));
  }

  // Check if email already exists
  const userExists = await User.findOne({ email });
  if (userExists) next(new AppError("Email already in use", 400));

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

  return res
    .status(201)
    .json({ message: `${newUser.userType} registered successfully` });
});

//OTP Route
//send OTP
const verifyEmail = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) next(new AppError("User not found", 404));

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

  user.otp = otp;
  user.otpExpiresAt = otpExpiry;
  await user.save();

  await sendEmail(email, otp);
  return res.status(200).send("OTP sent");
});

// verify otp
const verifyOTP = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) next(new AppError("User not found", 404));

  const now = new Date();
  if (user.otp !== otp || user.otpExpiresAt < now) {
    next(new AppError("Invalid or expired OTP", 400));
  }

  user.emailVerified = true;
  user.otp = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  return res.status(200).send("Email verified successfully");
});

// Login route
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) next(new AppError("User not found", 404));

  // Check if password matches
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) next(new AppError("Invalid credentials", 400));

  // Create JWT token
  const token = jwt.sign(
    { id: user._id, role: user.userType },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return res.json({
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.userType,
    },
  });
});

module.exports = {
  register,
  login,
  verifyEmail,
  verifyOTP,
};
