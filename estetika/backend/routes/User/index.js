const express = require("express");
const router = express.Router();

const inboxRoute = require("./inboxRoute");

router.use("/inbox", inboxRoute);

module.exports = router;
