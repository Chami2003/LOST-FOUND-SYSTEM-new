const express = require("express");
const router = express.Router();
const lostItemController = require("../Controllers/lostItemController");

// Post method -data insert
router.post("/add", lostItemController.addLostItem);
// Route to get all lost items
router.get("/all", lostItemController.getAllLostItems);
// update and delete
router.put("/update/:id", lostItemController.updateLostItem);
router.delete("/delete/:id", lostItemController.deleteLostItem);

module.exports = router;