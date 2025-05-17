const express = require("express");
const router = express.Router();
const {
  message_get,
  message_post,
} = require("../../controllers/User/MessageController");

router.get("/", message_get);
router.post("/", message_post);

module.exports = router;
