const LostItem = require("../Model/LostItem");
const { notifyNewLostItem } = require("../utils/itemNotifications");

const addLostItem = async (req, res) => {
    try {
        const newItem = new LostItem(req.body);
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
        const updatedItem = await LostItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ message: "Lost item updated successfully!", item: updatedItem });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteLostItem = async (req, res) => {
    try {
        await LostItem.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Lost item deleted successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    addLostItem,
    getAllLostItems,
    updateLostItem,
    deleteLostItem,
};
