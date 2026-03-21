const User = require("../Model/Model");

const getAllUsers = async (req, res, next) => {
    let users;
    try {
        users = await User.find();
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "An error occurred during DB fetch." });
    }

    //not found
    if (!users || users.length === 0) {
        return res.status(404).json({ message: "No users found" });
    }

    //display all user
    return res.status(200).json({ users });
};

