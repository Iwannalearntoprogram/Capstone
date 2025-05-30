const catchAsync = require("../../utils/catchAsync");

const alive = catchAsync(async (req, res, next) => {
  // return a message if server is alive
  return res.status(200).json({ message: "Server is still alive..." });
});

module.exports = {
  alive,
};
