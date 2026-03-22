const jwt = require("jsonwebtoken");
const InvalidToken = require("../models/utils/InvalidToken");
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

    if (decoded.id && decoded.role) {
      req.role = decoded.role;
      req.id = decoded.id;
      return next();
    }

    // Backward compatibility for tokens generated from older profile updates.
    if (decoded.user) {
      try {
        const legacyUser =
          typeof decoded.user === "string"
            ? JSON.parse(decoded.user)
            : decoded.user;

        if ((legacyUser?._id || legacyUser?.id) && legacyUser?.role) {
          req.id = legacyUser._id || legacyUser.id;
          req.role = legacyUser.role;
          return next();
        }
      } catch (error) {
        return next(new AppError("Access denied. Invalid Token", 403));
      }
    }

    return next(new AppError("Access denied. Invalid Token", 403));
  }
});

module.exports = verifyToken;
