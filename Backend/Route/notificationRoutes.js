const express = require("express");
const router = express.Router();
const notificationController = require("../Controllers/notificationController");

router.get("/", notificationController.getNotifications);
router.post("/mark-read", notificationController.markAllRead);

module.exports = router;
