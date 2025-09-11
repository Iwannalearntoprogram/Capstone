const express = require("express");
const router = express.Router();
const {
  conversation_summary,
} = require("../../controllers/User/ConversationController");

router.get("/summary", conversation_summary);

module.exports = router;
