require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const router = require('./Route/UserRoute');
const foundItemRoutes = require('./Route/FoundItemRoute');
const lostItemRoutes = require('./Route/lostItemRoutes');
const notificationRoutes = require('./Route/notificationRoutes');
const auctionRoutes = require('./Route/auctionRoutes');
const { startExpiryScheduler } = require('./utils/expiryScheduler');
const { ensureAdminUser } = require('./utils/ensureAdminUser');

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use("/users", router);
app.use("/api/found-items", foundItemRoutes);
app.use("/api/lost-items", lostItemRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/auctions", auctionRoutes);

const PORT = process.env.PORT || 5001;

// Listen immediately so the API is reachable even if MongoDB is slow or fails to connect.
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

mongoose
    .connect(
        "mongodb://admin:JODBgt9DODMBnSLV@ac-mi94ihy-shard-00-00.zxwd5yw.mongodb.net:27017,ac-mi94ihy-shard-00-01.zxwd5yw.mongodb.net:27017,ac-mi94ihy-shard-00-02.zxwd5yw.mongodb.net:27017/test?ssl=true&replicaSet=atlas-13fnl4-shard-0&authSource=admin&retryWrites=true&w=majority"
    )
    .then(async () => {
        console.log("Connected to MongoDB (test.User_Management)");
        await ensureAdminUser();
        startExpiryScheduler();
    })
    .catch((err) => console.error("MongoDB connection error:", err));