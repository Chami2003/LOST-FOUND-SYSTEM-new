
const express = require('express');
const mongoose = require('mongoose');

const app = express();



// middleware

app.use(express.json());

app.use("/api/found-items", require("./Route/FoundItemRoute"));
app.use("/", (req, res, next) => {
    res.send("It is workingggg");
});




mongoose.connect("mongodb://admin:JODBgt9DODMBnSLV@ac-mi94ihy-shard-00-00.zxwd5yw.mongodb.net:27017,ac-mi94ihy-shard-00-01.zxwd5yw.mongodb.net:27017,ac-mi94ihy-shard-00-02.zxwd5yw.mongodb.net:27017/?ssl=true&replicaSet=atlas-13fnl4-shard-0&authSource=admin&retryWrites=true&w=majority")
    .then(() =>
        console.log("Connected to MongoDB"))

    .then(() => {
        app.listen(5001);
    })
    .catch((err) => {
        console.log(err);
    });