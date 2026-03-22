const Notification = require("../Model/Notification");

async function notifyNewLostItem(item) {
  await Notification.create({
    type: "lost",
    message: `New lost item reported: ${item.itemName}`,
    itemName: item.itemName,
    itemId: item._id,
  });
}

async function notifyNewFoundItem(item) {
  await Notification.create({
    type: "found",
    message: `New found item registered: ${item.itemName}`,
    itemName: item.itemName,
    itemId: item._id,
  });
}

module.exports = { notifyNewLostItem, notifyNewFoundItem };
