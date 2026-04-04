const mongoose = require("mongoose");

const lostItemSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    dateLost: { type: Date, required: true },
    contact: { type: String, required: true },
    imageUrl: { type: String, required: false },
    imageUrls: [{ type: String }],
    claimed: { type: Boolean, default: false },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ["active", "claimed", "expired"], default: "active" },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    expiredAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("LostItem", lostItemSchema);