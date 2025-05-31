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
const {
  design_recommendation_get,
  design_recommendation_match,
  design_recommendation_post,
  design_recommendation_put,
  design_recommendation_delete,
} = require("../../controllers/Project/DesignRecommendationController");

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

router.get("/recommendation", design_recommendation_get);
router.get("/recommendation/match", design_recommendation_match);
router.post("/recommendation", design_recommendation_post);
router.put("/recommendation", design_recommendation_put);
router.delete("/recommendation", design_recommendation_delete);

module.exports = router;
