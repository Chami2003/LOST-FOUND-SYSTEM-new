const FoundItem = require("../Model/FoundItemModel");
const { notifyNewFoundItem } = require("../utils/itemNotifications");

// Add a new found item
const addFoundItem = async (req, res) => {
    try {
        const newItem = new FoundItem(req.body);
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
        const updatedItem = await FoundItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ message: "Found item updated successfully!", item: updatedItem });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete found item
const deleteFoundItem = async (req, res) => {
    try {
        await FoundItem.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Found item deleted successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addFoundItem = addFoundItem;
exports.getAllFoundItems = getAllFoundItems;
exports.updateFoundItem = updateFoundItem;
exports.deleteFoundItem = deleteFoundItem;