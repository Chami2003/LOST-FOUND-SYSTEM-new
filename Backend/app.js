require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const router = require('./Route/UserRoute');

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use("/users", router);


mongoose.connect("mongodb://admin:JODBgt9DODMBnSLV@ac-mi94ihy-shard-00-00.zxwd5yw.mongodb.net:27017,ac-mi94ihy-shard-00-01.zxwd5yw.mongodb.net:27017,ac-mi94ihy-shard-00-02.zxwd5yw.mongodb.net:27017/test?ssl=true&replicaSet=atlas-13fnl4-shard-0&authSource=admin&retryWrites=true&w=majority")
    .then(() =>
        console.log("Connected to MongoDB (test.User_Management)"))

    .then(() => {
        app.listen(5001, () => {
            console.log("Server is running on port 5001");
        });
    })
    .catch((err) => {
        console.log(err);
    });