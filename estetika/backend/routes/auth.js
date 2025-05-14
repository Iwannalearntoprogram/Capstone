const express = require("express");
const router = express.Router();
const {
  register,
  login,
  verifyEmail,
  verifyOTP,
} = require("../controllers/User/AuthController");

router.post("/register", register);
router.post("/login", login);
router.post("/send-otp", verifyEmail);
router.post("/verify-otp", verifyOTP);

module.exports = router;
