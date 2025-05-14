const express = require("express");
const router = express.Router();
const {
  material_post,
  material_delete,
  material_get,
  material_put,
} = require("../../controllers/Project/MaterialController");

router.post("/", material_post);
router.delete("/", material_delete);
router.get("/", material_get);
router.put("/", material_put);

module.exports = router;
