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
  let { userId } = req.query;

  if (!userId) {
    userId = req.id;
  }

  const user = await User.findById(userId);

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
    userId,
    { $set: updateData },
    { new: true }
  );

  if (!updatedUser) return next(new AppError("User not Found.", 404));

  const expiration = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  const payload = { user: JSON.stringify(updatedUser), exp: expiration };
  const token = jwt.sign(payload, KEY);

  return res
    .status(200)
    .json({ message: "Account Successfully Updated", token });
});

module.exports = { users_index, user_update };
