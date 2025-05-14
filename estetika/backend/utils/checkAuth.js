const jwt = require("jsonwebtoken");
const InvalidToken = require("../models/User/InvalidToken");
const AppError = require("./appError");
const catchAsync = require("./catchAsync");

const verifyToken = catchAsync(async (req, res, next) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    // send back user if no token is provided
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  } else {
    const isInvalid = await InvalidToken.findOne({ token: token });
    if (isInvalid) {
      return next(new AppError("Access denied. Invalid Token", 403));
    }

    // check token if valid
    const decoded = jwt.verify(token, JWT_SECRET);
    req.role = decoded.role;
    req.userId = decoded.id;
    next();
  }
});

module.exports = verifyToken;
