const mongoose = require("mongoose");

const lostItemSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    dateLost: { type: Date, required: true },
    contact: { type: String, required: true },
    imageUrl: { type: String, required: false },
}, { timestamps: true });

module.exports = mongoose.model("LostItem", lostItemSchema);