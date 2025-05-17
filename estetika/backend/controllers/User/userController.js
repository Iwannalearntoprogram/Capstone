const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const User = require("../../models/User/User");

const users_index = catchAsync(async (req, res) => {
  const { exclude } = req.query;

  const users = await User.find({ username: { $ne: exclude } });

  if (!users || users.length === 0) {
    return next(new AppError("No users found", 404));
  }

  return res.status(200).json(users);
});

module.exports = { users_index };
