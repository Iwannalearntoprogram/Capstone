const express = require("express");
const router = express.Router();
const {
  category_get,
  category_post,
  category_put,
} = require("../../controllers/Project/CategoryTemplateController");

router.get("/", category_get);
router.post("/", category_post);
router.put("/", category_put);

module.exports = router;
