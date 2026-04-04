const mongoose = require("mongoose");
const FoundItem = require("../Model/FoundItemModel");
const Notification = require("../Model/Notification");
const { notifyNewFoundItem } = require("../utils/itemNotifications");

function normalizeImages(body) {
    const imageUrls = Array.isArray(body.imageUrls)
        ? body.imageUrls.map((x) => String(x || "").trim()).filter(Boolean)
        : [];
    const imageUrl = String(body.imageUrl || "").trim();
    if (!imageUrls.length && imageUrl) imageUrls.push(imageUrl);
    return { ...body, imageUrl: imageUrls[0] || imageUrl || "", imageUrls };
}

// Add a new found item
const addFoundItem = async (req, res) => {
    try {
        const itemData = normalizeImages(req.body);
        const newItem = new FoundItem(itemData);
        await newItem.save();
        try {
            await notifyNewFoundItem(newItem);
        } catch (nErr) {
            console.error("Notification create failed:", nErr.message);
        }
        res.status(201).json({ message: "Found item added successfully!", item: newItem });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all found items
const getAllFoundItems = async (req, res) => {
    try {
        const items = await FoundItem.find(); 
        res.status(200).json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update found item
const updateFoundItem = async (req, res) => {
    try {
        const updatedItem = await FoundItem.findByIdAndUpdate(req.params.id, normalizeImages(req.body), { new: true });
        res.status(200).json({ message: "Found item updated successfully!", item: updatedItem });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete found item
const deleteFoundItem = async (req, res) => {
    try {
        const id = req.params.id;
        await FoundItem.findByIdAndDelete(id);
        if (mongoose.Types.ObjectId.isValid(id)) {
            await Notification.deleteMany({ itemId: new mongoose.Types.ObjectId(id) });
        }
        res.status(200).json({ message: "Found item deleted successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Claim a found item
const claimFoundItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: "User ID is required to claim an item." });

        const item = await FoundItem.findById(id);
        if (!item) return res.status(404).json({ error: "Item not found." });
        if (item.claimed) return res.status(400).json({ error: "This item is already claimed." });

        item.claimed = true;
        item.claimedBy = userId;
        item.claimDate = new Date();
        item.status = "claimed";
        await item.save();

        res.status(200).json({ message: "Item claimed successfully!", item });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get reports for a specific user
const getMyReports = async (req, res) => {
    try {
        const { userId } = req.params;
        const items = await FoundItem.find({ reportedBy: userId });
        res.status(200).json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get claims for a specific user
const getMyClaims = async (req, res) => {
    try {
        const { userId } = req.params;
        const claims = await FoundItem.find({ claimedBy: userId });
        res.status(200).json(claims);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addFoundItem = addFoundItem;
exports.getAllFoundItems = getAllFoundItems;
exports.updateFoundItem = updateFoundItem;
exports.deleteFoundItem = deleteFoundItem;
exports.claimFoundItem = claimFoundItem;
exports.getMyClaims = getMyClaims;
exports.getMyReports = getMyReports;