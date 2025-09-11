const express = require("express");
const router = express.Router();
const {
  muteUser,
  unmuteUser,
} = require("../../controllers/User/MuteController");

router.post("/mute", muteUser);
router.post("/unmute", unmuteUser);

module.exports = router;
