const express = require("express");
const router = express.Router();
const {
  image_post,
  document_post,
  message_file_post,
  update_image_post,
  material_image_post,
  design_image_post,
  fetch_csv,
} = require("../../controllers/Project/FileController");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/image", upload.single("image"), image_post);
router.post("/document", upload.single("document"), document_post);
router.post("/message", upload.single("file"), message_file_post);
router.post("/project/update", upload.single("image"), update_image_post);
router.post("/material", upload.array("image", 4), material_image_post);
router.post("/design", upload.single("image"), design_image_post);
router.get("/fetch-csv", fetch_csv);

module.exports = router;
