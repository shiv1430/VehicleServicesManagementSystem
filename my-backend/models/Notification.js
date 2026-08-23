const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["booking", "reminder", "status", "invoice", "completed"], required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" }
}, { timestamps: true });
module.exports = mongoose.model("Notification", notificationSchema);