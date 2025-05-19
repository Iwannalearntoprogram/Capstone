const express = require("express");
const router = express.Router();
const {
  event_get,
  event_post,
  event_put,
  event_delete,
} = require("../../controllers/Project/EventController");

router.get("/", event_get);
router.post("/", event_post);
router.put("/", event_put);
router.delete("/", event_delete);

module.exports = router;
