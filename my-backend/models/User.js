const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    mobile: {
        type: String,
        required: true,
        trim: true,
        match: /^\+?[0-9\s()-]{7,20}$/
    },
    role: {
        type: String,
        enum: ["customer", "mechanic", "garage_owner", "admin"],
        default: "customer",
        required: true
    },
    password: {
        type: String,
        required: true
    }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;