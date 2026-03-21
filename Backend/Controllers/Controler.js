const User = require("../Model/Model");

const getAllUsers = async (req, res, next) => {
    const users = await User.find();
    return res.status(200).json({ users });

}
//not found
if (!users) {
    return res.status(404).json({ message: "No users found" });
}

//display all user
return res.status(200).json({ users });

exports.getAllUsers = getAllUsers;