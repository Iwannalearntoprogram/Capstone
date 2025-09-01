const express = require("express");
const router = express.Router();
const {
  rating_get,
  rating_post,
  rating_delete,
  rating_stats,
} = require("../../controllers/Project/RatingController");
const checkAuth = require("../../utils/checkAuth");

router.get("/", rating_get);
router.get("/stats", rating_stats);
router.post("/", checkAuth, rating_post);
router.delete("/", checkAuth, rating_delete);

module.exports = router;
