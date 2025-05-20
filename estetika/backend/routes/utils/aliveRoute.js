const express = require("express");
const router = express.Router();
const aliveController = require("../../controllers/utils/AliveController");

// Check if server is alive
router.get("/", aliveController.alive);

module.exports = router;
