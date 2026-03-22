const express = require("express");
const router = express.Router();

//Insert Model
const User = require("../Model/UserModel");
const controller = require("../Controllers/UserControler");

router.get("/", controller.getAllUsers)


router.post("/", controller.addUsers);
router.post("/login", controller.loginUser);

router.post("/send-otp", controller.sendOtp);

router.post("/verify-otp", controller.verifyOtp);
router.post("/update-password", controller.updatePassword);

router.get("/:id", controller.getById)
router.put("/:id", controller.updateUser)
router.delete("/:id", controller.deleteUser)


//export
module.exports = router;
