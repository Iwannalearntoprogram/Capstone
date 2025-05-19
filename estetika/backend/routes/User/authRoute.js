const express = require("express");
const router = express.Router();
const {
  register,
  login,
  verifyEmail,
  verifyOTP,
  logout,
} = require("../../controllers/User/AuthController");
const checkAuth = require("../../utils/checkAuth");

router.post("/register", register);
router.post("/login", login);
router.post("/send-otp", verifyEmail);
router.post("/verify-otp", verifyOTP);
router.get("/logout", checkAuth, logout);

module.exports = router;
