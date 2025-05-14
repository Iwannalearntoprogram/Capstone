const express = require("express");
const router = express.Router();
const { createUser } = require("../controllers/userController");

router.post("/api/users", createUser);

module.exports = router;
