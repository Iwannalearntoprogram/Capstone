const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const User = require("../../models/User/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const users_index = catchAsync(async (req, res) => {
  const { exclude } = req.query;

  const users = await User.find({ _id: { $ne: exclude } });

  if (!users || users.length === 0) {
    return next(new AppError("No users found", 404));
  }

  return res.status(200).json(users);
});

// Update User
const user_update = catchAsync(async (req, res, next) => {
  const KEY = process.env.JWT_SECRET;
  let { id } = req.query;

  if (!id) {
    id = req.id;
  }

  const user = await User.findById(id);

  if (!user) {
    return next(new AppError("User not Found.", 404));
  }

  // Handle password update
  if (req.body.newPassword && req.body.password) {
    const salt = await bcrypt.genSalt(10);

    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (isPasswordValid) {
      req.body.password = await bcrypt.hash(req.body.newPassword, salt);
      delete req.body.newPassword;
    } else {
      return next(new AppError("Incorrect Password", 401));
    }
  } else {
    // Prevent password field from being overwritten with undefined
    delete req.body.password;
    delete req.body.newPassword;
  }

  // Only allow updatable fields
  const updatableFields = [
    "firstName",
    "lastName",
    "fullName",
    "email",
    "username",
    "aboutMe",
    "phoneNumber",
    "profileImage",
    "role",
    "projectsId",
    "password",
  ];
  const updateData = {};
  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const updatedUser = await User.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  );

  if (!updatedUser) return next(new AppError("User not Found.", 404));

  const expiration = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  const payload = { user: JSON.stringify(updatedUser), exp: expiration };
  const token = jwt.sign(payload, KEY);

  return res.json({
    message: "Account Successfully Updated",
    user: {
      id: updatedUser._id,
      fullName: updatedUser.fullName,
      username: updatedUser.username,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      role: updatedUser.role,
      profileImage: updatedUser.profileImage,
    },
    token,
  });
});

// Get User by Id or Username
const user_get = catchAsync(async (req, res, next) => {
  const { id, username, role } = req.query;

  let user;
  if (id) {
    user = await User.findById(id).populate("projectsId");
  } else if (username) {
    user = await User.findOne({ username }).populate("projectsId");
  } else if (role) {
    user = await User.find({ role }).select("-password -__v");
  }

  if (!user) return next(new AppError("User not found", 404));

  let other;
  if (Array.isArray(user)) {
    other = user;
  } else {
    const { password, __v, ...rest } = user._doc;
    other = rest;
  }

  return res.status(200).json({ message: "User Fetched", user: other });
});

module.exports = { users_index, user_update, user_get };
