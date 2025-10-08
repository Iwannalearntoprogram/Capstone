const express = require("express");
const router = express.Router();
const {
  material_post,
  material_delete,
  material_get,
  material_put,
  vector_search,
  material_search,
} = require("../../controllers/Project/MaterialController");

router.post("/", material_post);
router.delete("/", material_delete);
router.get("/", material_get);
router.get("/search", vector_search);
router.get("/match", material_search);
router.put("/", material_put);

module.exports = router;
