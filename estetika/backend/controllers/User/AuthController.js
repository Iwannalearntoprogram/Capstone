const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User/User");
const sendEmail = require("../../utils/sendEmail");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const InvalidToken = require("../../models/utils/InvalidToken");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ✅ Register route
const register = catchAsync(async (req, res, next) => {
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
  if (userExists) return next(new AppError("Email already in use", 400));

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    fullName: `${firstName} ${lastName}`,
    firstName,
    lastName,
    username,
    email,
    password: hashedPassword,
    phoneNumber,
    role: role || "client",
  });

  await newUser.save();

  return res
    .status(201)
    .json({ message: `${newUser.role} registered successfully` });
});

//OTP Route
//send OTP
const verifyEmail = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return next(new AppError("User not found", 404));

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

  user.otp = otp;
  user.otpExpiresAt = otpExpiry;
  await user.save();

  // console.log("Generated OTP:", otp);

  await sendEmail(email, otp);
  return res.status(200).send("OTP sent");
});

// verify otp
const verifyOTP = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) return next(new AppError("User not found", 404));

  const now = new Date();
  if (user.otp !== otp || user.otpExpiresAt < now) {
    return next(new AppError("Invalid or expired OTP", 400));
  }

  user.emailVerified = true;
  user.otp = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  return res.status(200).send("Email verified successfully");
});

// Forgot Password: Step 1 - Initiate
const forgotPasswordInitiate = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError("Email and password required", 400));

  const user = await User.findOne({ email });
  if (!user) return next(new AppError("User not found", 404));

  // Create pending password hash but do not apply yet
  const pendingHash = await bcrypt.hash(password, 10);
  user.pendingPasswordHash = pendingHash;

  // Generate OTP specific to reset
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
  user.resetOtp = otp;
  user.resetOtpExpiresAt = otpExpiry;
  await user.save();

  // Send email with OTP
  // console.log("Password reset OTP:", otp);
  await sendEmail(email, otp);

  return res
    .status(200)
    .json({ message: "OTP sent to email for password reset" });
});

// Forgot Password: Step 2 - Confirm
const forgotPasswordConfirm = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) return next(new AppError("Email and OTP required", 400));

  const user = await User.findOne({ email });
  if (!user) return next(new AppError("User not found", 404));

  const now = new Date();
  if (!user.resetOtp || user.resetOtp !== otp || user.resetOtpExpiresAt < now) {
    return next(new AppError("Invalid or expired OTP", 400));
  }
  if (!user.pendingPasswordHash)
    return next(new AppError("No password change requested", 400));

  // Apply new password
  user.password = user.pendingPasswordHash;
  user.pendingPasswordHash = undefined;
  user.resetOtp = undefined;
  user.resetOtpExpiresAt = undefined;
  await user.save();

  return res.status(200).json({ message: "Password reset successful" });
});

// Login route
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) return next(new AppError("User not found", 404));

  // Check if password matches
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return next(new AppError("Invalid credentials", 400));

  // Create JWT token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return res.json({
    user: {
      id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profileImage: user.profileImage,
      isArchived: user.isArchived,
    },
    token,
  });
});

// Logout route
const logout = catchAsync(async (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return next(new AppError("Authorization header missing", 401));
  }
  const token = authHeader.split(" ")[1];

  const invalidToken = new InvalidToken({
    token: token,
  });

  await invalidToken.save();

  return res
    .status(200)
    .json({ message: "Logged Out Successfully", invalidToken });
});

// ✅ Google OAuth Route
const googleAuth = catchAsync(async (req, res, next) => {
  console.log("🚀 Google auth request received");
  console.log("📡 Request body:", req.body);

  const { access_token } = req.body;

  if (!access_token) {
    console.log("❌ No access token provided");
    return next(new AppError("Access token is required", 400));
  }

  try {
    console.log("🔍 Verifying access token with Google...");
    // Verify the access token with Google
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`
    );
    const googleUser = await response.json();

    console.log("📱 Google user data:", googleUser);

    if (!googleUser.email) {
      console.log("❌ Failed to get email from Google response");
      return next(
        new AppError("Failed to get user information from Google", 400)
      );
    }

    console.log("🔍 Looking for existing user with Google ID:", googleUser.id);
    let user = await User.findOne({ googleId: googleUser.id });

    if (!user) {
      console.log(
        "🔍 No user found with Google ID, checking email:",
        googleUser.email
      );
      // Check if user exists with this email
      user = await User.findOne({ email: googleUser.email });

      if (user) {
        console.log(
          "✅ Found existing user with email, linking Google account"
        );
        // Link existing account with Google
        user.googleId = googleUser.id;
        user.avatar = googleUser.picture;
        // Keep profileImage in sync for client/mobile compatibility
        if (!user.profileImage) {
          user.profileImage = googleUser.picture;
        }
        await user.save();
      } else {
        console.log("🆕 Creating new user from Google data");
        // Create new user
        user = new User({
          googleId: googleUser.id,
          firstName: googleUser.given_name || googleUser.name.split(" ")[0],
          lastName:
            googleUser.family_name ||
            googleUser.name.split(" ").slice(1).join(" "),
          username: googleUser.email.split("@")[0],
          email: googleUser.email,
          avatar: googleUser.picture,
          profileImage: googleUser.picture,
          emailVerified: true,
          role: "client",
        });

        await user.save();
        console.log("✅ New user created successfully");
      }
    } else {
      console.log("✅ Found existing user with Google ID");
    }

    // Generate JWT token (align payload with normal login)
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log("✅ JWT token generated, sending response");

    return res.status(200).json({
      message: "Google authentication successful",
      token,
      user: {
        id: user._id,
        fullName:
          user.fullName ||
          `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        profileImage: user.profileImage || user.avatar,
        isArchived: user.isArchived,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.log("💥 Google authentication error:", error);
    return next(new AppError("Google authentication failed", 400));
  }
});

module.exports = {
  register,
  login,
  verifyEmail,
  verifyOTP,
  forgotPasswordInitiate,
  forgotPasswordConfirm,
  logout,
  googleAuth,
};
