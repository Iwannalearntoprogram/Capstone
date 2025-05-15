const express = require("express");
const router = express.Router();
const {
  phase_get,
  phase_post,
  phase_put,
  phase_delete,
} = require("../../controllers/Project/PhaseController");

router.get("/", phase_get);
router.post("/", phase_post);
router.put("/", phase_put);
router.delete("/", phase_delete);

module.exports = router;
