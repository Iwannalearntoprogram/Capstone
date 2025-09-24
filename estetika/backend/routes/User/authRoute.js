const express = require("express");
const router = express.Router();
const {
  register,
  login,
  verifyEmail,
  verifyOTP,
  forgotPasswordInitiate,
  forgotPasswordConfirm,
  forgotPasswordResend,
  logout,
  googleAuth,
} = require("../../controllers/User/AuthController");
const checkAuth = require("../../utils/checkAuth");

router.post("/register", register);
router.post("/login", login);
router.post("/send-otp", verifyEmail);
router.post("/verify-otp", verifyOTP);
router.post("/forgot/initiate", forgotPasswordInitiate);
router.post("/forgot/confirm", forgotPasswordConfirm);
router.post("/forgot/resend", forgotPasswordResend);
router.post("/google", googleAuth);
router.get("/logout", checkAuth, logout);

module.exports = router;
