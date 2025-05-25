const express = require("express");
const router = express.Router();
const {
  project_get,
  project_post,
  project_put,
  project_delete,
} = require("../../controllers/Project/ProjectController");
const {
  project_update_get,
  project_update_post,
  project_update_put,
  project_update_delete,
} = require("../../controllers/Project/ProjectUpdateController");

// Project
router.get("/", project_get);
router.post("/", project_post);
router.put("/", project_put);
router.delete("/", project_delete);

// Project Update
router.get("/update", project_update_get);
router.post("/update", project_update_post);
router.put("/update", project_update_put);
router.delete("/update", project_update_delete);

module.exports = router;
