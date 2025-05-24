const express = require("express");
const router = express.Router();
const {
  image_post,
  document_post,
  message_file_post,
} = require("../../controllers/Project/FileController");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/image", upload.single("image"), image_post);
router.post("/document", upload.single("document"), document_post);
router.post("/message", upload.single("file"), message_file_post);

module.exports = router;
