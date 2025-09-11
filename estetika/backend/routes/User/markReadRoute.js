const express = require("express");
const router = express.Router();
const {
  markMessagesRead,
} = require("../../controllers/User/MarkReadController");

router.post("/mark-read", markMessagesRead);

module.exports = router;
