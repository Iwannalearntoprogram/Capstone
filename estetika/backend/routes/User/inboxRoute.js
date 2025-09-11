const express = require("express");
const router = express.Router();
const { inbox_summary } = require("../../controllers/User/InboxController");

router.get("/summary", inbox_summary);

module.exports = router;
