const express = require("express");
const router = express.Router();
const {
  project_get,
  project_post,
  project_put,
  project_delete,
} = require("../../controllers/Project/ProjectController");

router.get("/", project_get);
router.post("/", project_post);
router.put("/", project_put);
router.delete("/", project_delete);

module.exports = router;
