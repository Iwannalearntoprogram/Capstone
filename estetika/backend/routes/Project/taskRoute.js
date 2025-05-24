const express = require("express");
const router = express.Router();
const {
  task_get,
  task_post,
  task_put,
  task_delete,
} = require("../../controllers/Project/TaskController");

router.get("/", task_get);
router.post("/", task_post);
router.put("/", task_put);
router.delete("/", task_delete);

module.exports = router;
