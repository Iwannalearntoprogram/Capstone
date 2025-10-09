const express = require("express");
const router = express.Router();
const {
  registry_get,
  registry_post,
} = require("../../controllers/Project/AttributeRegistryController");

router.get("/", registry_get);
router.post("/", registry_post);

module.exports = router;
