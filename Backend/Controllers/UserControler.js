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
//data insert
const addUsers = async (req, res, next) => {
    const { name, email, password } = req.body;

    let user;
    try {
        user = new User({
            name,
            email,
            password
        });
        await user.save();
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "An error occurred during user creation." });
    }

    return res.status(201).json({ user });
};
//Get by Id
const getById = async (req, res, next) => {
    const id = req.params.id;
    let user;
    try {
        user = await User.findById(id);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "An error occurred during DB fetch." });
    }
    if (!user) {
        return res.status(404).json({ message: "No user found" });
    }
    return res.status(200).json({ user });
}


//update User
const updateUser = async (req, res, next) => {
    const id = req.params.id;
    const { name, email, password } = req.body;
    let user;
    try {
        user = await User.findByIdAndUpdate(id, { name, email, password });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Unable to Uptade." });
    }
    return res.status(200).json({ user });
}
exports.getAllUsers = getAllUsers;
exports.addUsers = addUsers;
exports.getById = getById;
exports.updateUser = updateUser;
