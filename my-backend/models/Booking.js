const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    garage: { type: mongoose.Schema.Types.ObjectId, ref: "Garage", required: true },
    mechanic: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    service: { name: String, price: Number },
    appointmentAt: { type: Date, required: true },
    status: { type: String, default: "pending" },
    notes: String,
    completedAt: Date
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);