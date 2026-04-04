const express = require("express");
const router = express.Router();
const auctionController = require("../Controllers/auctionController");

router.get("/", auctionController.getAuctions);
router.post("/ensure", auctionController.ensureAuction);
router.patch("/:id/admin-assign", auctionController.assignWinnerAndDelivery);
router.post("/:id/bid", auctionController.placeBid);

module.exports = router;
