const mongoose = require("mongoose");

const foundItemSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true }, 
    location: { type: String, required: true },
    dateFound: { type: Date, required: true }, 
    contact: { type: String, required: true },
    imageUrl: { type: String, required: false },
    imageUrls: [{ type: String }],
    claimed: { type: Boolean, default: false },
    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    claimDate: { type: Date },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ["active", "claimed", "expired"], default: "active" },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    expiredAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("FoundItem", foundItemSchema);