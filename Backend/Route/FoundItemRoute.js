const express = require("express");
const router = express.Router();
const foundItemController = require("../Controllers/FoundItemController");

router.post("/add", foundItemController.addFoundItem);
router.get("/all", foundItemController.getAllFoundItems);
router.put("/update/:id", foundItemController.updateFoundItem);
router.delete("/delete/:id", foundItemController.deleteFoundItem);
router.put("/claim/:id", foundItemController.claimFoundItem);
router.get("/my-claims/:userId", foundItemController.getMyClaims);
router.get("/my-reports/:userId", foundItemController.getMyReports);

module.exports = router;