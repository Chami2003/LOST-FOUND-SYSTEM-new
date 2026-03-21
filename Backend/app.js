
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/lost-items", require("./Route/lostItemRoutes"));

// middleware


mongoose.connect("mongodb://admin:JODBgt9DODMBnSLV@ac-mi94ihy-shard-00-00.zxwd5yw.mongodb.net:27017,ac-mi94ihy-shard-00-01.zxwd5yw.mongodb.net:27017,ac-mi94ihy-shard-00-02.zxwd5yw.mongodb.net:27017/?ssl=true&replicaSet=atlas-13fnl4-shard-0&authSource=admin&retryWrites=true&w=majority")
    .then(() =>
        console.log("Connected to MongoDB"))

    .then(() => {
        app.listen(5001);
    })
    .catch((err) => {
        console.log(err);
    });