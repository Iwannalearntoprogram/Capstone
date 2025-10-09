const express = require("express");
const router = express.Router();
const {
  request_post,
  request_get,
  request_put,
} = require("../../controllers/Project/MaterialRequestController");

router.post("/", request_post);
router.get("/", request_get);
router.put("/", request_put);

module.exports = router;
