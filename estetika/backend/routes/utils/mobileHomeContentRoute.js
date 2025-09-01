const express = require("express");
const router = express.Router();
const checkAuth = require("../../utils/checkAuth");
const {
  getContent,
  updateContent,
  addCarouselImage,
  removeCarouselImage,
  updateAboutText,
  getContentHistory,
} = require("../../controllers/utils/MobileHomeContentController");

// Public route to get active content
router.get("/", getContent);

// Admin-only routes
router.use(checkAuth);

router.post("/", updateContent);
router.post("/carousel/add", addCarouselImage);
router.delete("/carousel/:imageId", removeCarouselImage);
router.patch("/about", updateAboutText);
router.get("/history", getContentHistory);

module.exports = router;
