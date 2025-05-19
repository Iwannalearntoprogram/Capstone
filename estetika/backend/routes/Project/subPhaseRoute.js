const express = require("express");
const router = express.Router();
const {
  subphase_get,
  subphase_post,
  subphase_put,
  subphase_delete,
} = require("../../controllers/Project/SubPhaseController");

router.get("/", subphase_get);
router.post("/", subphase_post);
router.put("/", subphase_put);
router.delete("/", subphase_delete);

module.exports = router;
