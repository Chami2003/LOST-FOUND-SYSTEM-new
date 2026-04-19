const LostItem = require("../Model/LostItem");
const FoundItem = require("../Model/FoundItemModel");
const { notifyExpiredItem } = require("./itemNotifications");

const EXPIRY_DAYS_MS = 25 * 24 * 60 * 60 * 1000;

function unclaimedFilter(now) {
  const cutoff = new Date(now.getTime() - EXPIRY_DAYS_MS);
  return {
    $and: [
      { createdAt: { $lte: cutoff } },
      { $or: [{ claimed: false }, { claimed: { $exists: false } }] },
      { $or: [{ status: { $ne: "expired" } }, { status: { $exists: false } }] },
    ],
  };
}

async function expireLostItems(now) {
  const items = await LostItem.find(unclaimedFilter(now));
  for (const item of items) {
    item.status = "expired";
    item.expiredAt = now;
    item.expiresAt = item.expiresAt || new Date(item.createdAt.getTime() + EXPIRY_DAYS_MS);
    await item.save();
    await notifyExpiredItem("lost", item);
  }
  return items.length;
}

async function expireFoundItems(now) {
  const items = await FoundItem.find(unclaimedFilter(now));
  for (const item of items) {
    item.status = "expired";
    item.expiredAt = now;
    item.expiresAt = item.expiresAt || new Date(item.createdAt.getTime() + EXPIRY_DAYS_MS);
    await item.save();
    await notifyExpiredItem("found", item);
  }
  return items.length;
}

async function expireUnclaimedItems() {
  const now = new Date();
  const [lostCount, foundCount] = await Promise.all([expireLostItems(now), expireFoundItems(now)]);
  if (lostCount || foundCount) {
    console.log(`Expired items job: ${lostCount} lost, ${foundCount} found marked expired.`);
  }
}

function startExpiryScheduler() {
  // Run once on startup, then every hour.
  expireUnclaimedItems().catch((err) => {
    console.error("Initial expiry check failed:", err.message);
  });
  setInterval(() => {
    expireUnclaimedItems().catch((err) => {
      console.error("Scheduled expiry check failed:", err.message);
    });
  }, 60 * 60 * 1000);
}

module.exports = { startExpiryScheduler, expireUnclaimedItems };
