const express = require("express");
const router = express.Router();
const {
  users_index,
  user_update,
} = require("../../controllers/User/UserController");
const {
  notification_get,
  notification_post,
  notification_put,
  notification_delete,
} = require("../../controllers/utils/NotificationController");

router.get("/", users_index);
router.put("/", user_update);

router.get("/notification", notification_get);
router.post("/notification", notification_post);
router.put("/notification", notification_put);
router.delete("/notification", notification_delete);

module.exports = router;
