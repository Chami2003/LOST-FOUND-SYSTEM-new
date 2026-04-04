const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true   // required true  (better practice)
    },
    email: {
        type: String,
        required: true,
        unique: true,    // duplicate emails avoid 
        lowercase: true
    },
    phone: {
        type: String
    },
    password: {
        type: String,
        required: true
    },
    otp: {
        type: String
    },
    otpExpiry: {
        type: Date
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    lastLoginAt: {
        type: Date,
    },
}, {
    collection: 'User_Management',
    timestamps: true   // createdAt & updatedAt auto add 
});

module.exports = mongoose.model("User", userSchema);