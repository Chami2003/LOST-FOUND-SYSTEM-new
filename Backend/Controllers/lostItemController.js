const LostItem = require("../Model/LostItem");

// @desc    Add a new lost item to the database
// @route   POST /api/lost-items/add
const addLostItem = async (req, res) => {
    try {
        const newItem = new LostItem(req.body);
        await newItem.save();
        res.status(201).json({ message: "Item added successfully!", item: newItem });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Get all lost items from the database
// @route   GET /api/lost-items/all
const getAllLostItems = async (req, res) => {
    try {
        // Find all documents in the LostItem collection
        const items = await LostItem.find(); 
        res.status(200).json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Update a lost item by ID
// @route   PUT /api/lost-items/update/:id
const updateLostItem = async (req, res) => {
    try {
        const updatedItem = await LostItem.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true } // This returns the updated data instead of the old data
        );
        res.status(200).json({ message: "Item updated successfully!", item: updatedItem });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Delete a lost item by ID
// @route   DELETE /api/lost-items/delete/:id
const deleteLostItem = async (req, res) => {
    try {
        await LostItem.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Item deleted successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Exporting functions to be used in routes
exports.addLostItem = addLostItem;
exports.getAllLostItems = getAllLostItems;
exports.updateLostItem = updateLostItem; // Add this
exports.deleteLostItem = deleteLostItem;

