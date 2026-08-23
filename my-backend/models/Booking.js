const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    garage: { type: mongoose.Schema.Types.ObjectId, ref: "Garage", required: true, index: true },
    mechanic: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    service: { name: String, price: Number },
    appointmentAt: { type: Date, required: true },
    status: { type: String, enum: ["pending", "confirmed", "rejected", "rescheduled", "cancelled", "completed"], default: "pending" },
    progressStatus: { type: String, enum: ["Booking Confirmed", "Vehicle Received", "Inspection", "Repair in Progress", "Testing", "Completed", "Ready for Pickup"] },
    statusHistory: [{ status: String, note: String, changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, changedAt: { type: Date, default: Date.now } }],
    notes: String,
    completedAt: Date
}, { timestamps: true });

bookingSchema.index({ garage: 1, appointmentAt: 1 }, { unique: true });
module.exports = mongoose.model("Booking", bookingSchema);