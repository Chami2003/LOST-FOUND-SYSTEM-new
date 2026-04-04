const Auction = require("../Model/Auction");

const getAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find().sort({ updatedAt: -1 });
    res.status(200).json(auctions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const ensureAuction = async (req, res) => {
  const { itemType, itemId, itemName, startingPrice } = req.body;
  if (!itemType || !itemId || !itemName) {
    return res.status(400).json({ message: "itemType, itemId and itemName are required" });
  }
  try {
    const basePrice = Number(startingPrice);
    const initial = Number.isFinite(basePrice) && basePrice >= 0 ? basePrice : 100;
    const auction = await Auction.findOneAndUpdate(
      { itemType, itemId },
      {
        $setOnInsert: {
          itemType,
          itemId,
          itemName,
          startingPrice: initial,
          highestBid: initial,
          status: "open",
        },
      },
      { new: true, upsert: true }
    );
    res.status(200).json(auction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const placeBid = async (req, res) => {
  const { id } = req.params;
  const { bidderName, bidderEmail, amount } = req.body;
  const bidAmount = Number(amount);
  if (!bidderName || !bidderEmail || !Number.isFinite(bidAmount)) {
    return res.status(400).json({ message: "bidderName, bidderEmail and valid amount are required" });
  }

  try {
    const auction = await Auction.findById(id);
    if (!auction) return res.status(404).json({ message: "Auction not found" });
    if (auction.status !== "open") return res.status(400).json({ message: "Auction is closed" });
    if (bidAmount <= auction.highestBid) {
      return res.status(400).json({ message: `Bid must be higher than current highest (${auction.highestBid})` });
    }

    auction.highestBid = bidAmount;
    auction.highestBidderName = bidderName;
    auction.highestBidderEmail = bidderEmail;
    auction.bids.push({ bidderName, bidderEmail, amount: bidAmount });
    await auction.save();
    res.status(200).json(auction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const assignWinnerAndDelivery = async (req, res) => {
  const { id } = req.params;
  const { winnerBidderName, winnerBidderEmail, deliveryPersonName, deliveryPersonContact } = req.body;

  if (!winnerBidderName || !winnerBidderEmail) {
    return res.status(400).json({ message: "Winner name and email are required" });
  }

  try {
    const auction = await Auction.findById(id);
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    auction.status = "closed";
    auction.winnerBidderName = String(winnerBidderName).trim();
    auction.winnerBidderEmail = String(winnerBidderEmail).trim().toLowerCase();
    auction.deliveryPersonName =
      deliveryPersonName != null ? String(deliveryPersonName).trim() : "";
    auction.deliveryPersonContact =
      deliveryPersonContact != null ? String(deliveryPersonContact).trim() : "";

    await auction.save();
    res.status(200).json(auction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAuctions, ensureAuction, placeBid, assignWinnerAndDelivery };
