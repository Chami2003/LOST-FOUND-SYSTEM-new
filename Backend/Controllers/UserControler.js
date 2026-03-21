const User = require("../Model/Model");
const nodemailer = require('nodemailer');

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
    const { name, email, phone, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "An error occurred during validation." });
    }

    let user;
    try {
        user = new User({
            name: name || email.split('@')[0],
            email,
            phone: phone || undefined,
            password
        });
        await user.save();
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "An error occurred during user creation." });
    }

    return res.status(201).json({ user });
};

// login validation
const loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const user = await User.findOne({ email, password });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        return res.status(200).json({ message: "Login valid", user });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "An error occurred during login." });
    }
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
//delete user
const deleteUser = async (req, res, next) => {
    const id = req.params.id;
    let user;
    try {
        user = await User.findByIdAndDelete(id);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Unable to Delete." });
    }
    return res.status(200).json({ user });
}

//send OTP
const sendOtp = async (req, res, next) => {
    const { email, forgotPassword } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    try {
        let user = await User.findOne({ email });
        if (forgotPassword && !user) {
            return res.status(404).json({ message: "No account found with this email" });
        }
        if (!user) {
            user = new User({ email, otp, otpExpiry });
        } else {
            user.otp = otp;
            user.otpExpiry = otpExpiry;
        }
        await user.save();

        // Send email (skip if no real credentials - OTP is saved, check console for testing)
        const emailUser = process.env.EMAIL_USER || 'your-email@gmail.com';
        const emailPass = process.env.EMAIL_PASS || 'your-password';

        if (emailUser === 'your-email@gmail.com' || !emailPass || emailPass === 'your-password') {
            // Dev mode: no real email config - OTP saved to DB, log it for testing
            console.log('\n--- OTP for testing ---');
            console.log(`Email: ${email}`);
            console.log(`OTP: ${otp}`);
            console.log('--- Use this OTP on the OTP page ---\n');
            return res.status(200).json({ message: "OTP sent successfully" });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: emailUser, pass: emailPass }
        });

        await transporter.sendMail({
            from: emailUser,
            to: email,
            subject: 'OTP for Account Verification',
            text: `Your OTP is ${otp}. It expires in 2 minutes.`
        });

        return res.status(200).json({ message: "OTP sent successfully" });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "An error occurred" });
    }
}

// update password (forgot password flow: verify OTP then set new password)
const updatePassword = async (req, res, next) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: "Email, OTP and new password are required" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        user.password = newPassword;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        return res.status(200).json({ message: "Password updated successfully" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "An error occurred" });
    }
};

//verify OTP
const verifyOtp = async (req, res, next) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // OTP verified, clear OTP
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        return res.status(200).json({ message: "OTP verified successfully" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "An error occurred" });
    }
}

exports.getAllUsers = getAllUsers;
exports.addUsers = addUsers;
exports.loginUser = loginUser;
exports.getById = getById;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.sendOtp = sendOtp;
exports.verifyOtp = verifyOtp;
exports.updatePassword = updatePassword;
