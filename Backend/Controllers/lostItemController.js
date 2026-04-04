const mongoose = require("mongoose");
const LostItem = require("../Model/LostItem");
const Notification = require("../Model/Notification");
const { notifyNewLostItem } = require("../utils/itemNotifications");

function normalizeImages(body) {
    const imageUrls = Array.isArray(body.imageUrls)
        ? body.imageUrls.map((x) => String(x || "").trim()).filter(Boolean)
        : [];
    const imageUrl = String(body.imageUrl || "").trim();
    if (!imageUrls.length && imageUrl) imageUrls.push(imageUrl);
    return { ...body, imageUrl: imageUrls[0] || imageUrl || "", imageUrls };
}

const addLostItem = async (req, res) => {
    try {
        const itemData = normalizeImages(req.body);
        const newItem = new LostItem(itemData);
        await newItem.save();
        try {
            await notifyNewLostItem(newItem);
        } catch (nErr) {
            console.error("Notification create failed:", nErr.message);
        }
        res.status(201).json({ message: "Lost item added successfully!", item: newItem });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAllLostItems = async (req, res) => {
    try {
        const items = await LostItem.find();
        res.status(200).json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateLostItem = async (req, res) => {
    try {
        const updatedItem = await LostItem.findByIdAndUpdate(req.params.id, normalizeImages(req.body), { new: true });
        res.status(200).json({ message: "Lost item updated successfully!", item: updatedItem });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteLostItem = async (req, res) => {
    try {
        const id = req.params.id;
        await LostItem.findByIdAndDelete(id);
        if (mongoose.Types.ObjectId.isValid(id)) {
            await Notification.deleteMany({ itemId: new mongoose.Types.ObjectId(id) });
        }
        res.status(200).json({ message: "Lost item deleted successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getMyReports = async (req, res) => {
    try {
        const { userId } = req.params;
        const items = await LostItem.find({ reportedBy: userId });
        res.status(200).json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    addLostItem,
    getAllLostItems,
    updateLostItem,
    deleteLostItem,
    getMyReports,
};
