const express = require("express");
const router = express.Router();

//Insert Model
const User = require("../Model/Model");

router.get("/", controller.getAllUsers)


router.post("/", controller.addUsers);

router.get("/:id", controller.getById)
router.put("/:id", controller.updateUser)

//export
module.exports = router;
