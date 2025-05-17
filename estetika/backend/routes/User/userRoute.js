const express = require("express");
const router = express.Router();
const { users_index } = require("../../controllers/User/UserController");

router.get("/", users_index);

module.exports = router;
