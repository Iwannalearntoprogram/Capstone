const catchAsync = require("../../utils/catchAsync");
const User = require("./userModel");

const createUser = catchAsync(async (req, res, next) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    return res.status(200).json({ message: "User created!", user: newUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = { createUser };
