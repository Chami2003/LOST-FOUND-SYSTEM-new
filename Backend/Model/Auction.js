const mongoose = require("mongoose");

const auctionBidSchema = new mongoose.Schema(
  {
    bidderName: { type: String, required: true },
    bidderEmail: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false, timestamps: true }
);

const auctionSchema = new mongoose.Schema(
  {
    itemType: { type: String, enum: ["lost", "found"], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    itemName: { type: String, required: true },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    startingPrice: { type: Number, required: true, min: 0, default: 100 },
    highestBid: { type: Number, required: true, min: 0, default: 100 },
    highestBidderName: { type: String, default: "" },
    highestBidderEmail: { type: String, default: "" },
    winnerBidderName: { type: String, default: "" },
    winnerBidderEmail: { type: String, default: "" },
    deliveryPersonName: { type: String, default: "" },
    deliveryPersonContact: { type: String, default: "" },
    bids: { type: [auctionBidSchema], default: [] },
  },
  { timestamps: true }
);

auctionSchema.index({ itemType: 1, itemId: 1 }, { unique: true });

module.exports = mongoose.model("Auction", auctionSchema);
