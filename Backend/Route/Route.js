const express = require("express");
const router = express.Router();

//Insert Model
const User = require("../Model/Model");

router.get("/", controller.getAllUsers)

router.post("/", async (req, res, next) => {
    const { name, email, password } = req.body;
    const user = new User({ name, email, password });
    await user.save();
    return res.status(201).json({ user });
});

module.exports = router;
