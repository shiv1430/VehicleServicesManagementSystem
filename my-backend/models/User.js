const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    mobile: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: "customer"
    },
    skills: [{
        type: String,
        trim: true
    }],
    primaryGarage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Garage"
    },
    membershipStatus: {
        type: String,
        enum: ["none", "pending", "active", "rejected"],
        default: "none"
    },
    password: {
        type: String,
        required: true
    }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;