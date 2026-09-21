const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    garage: { type: mongoose.Schema.Types.ObjectId, ref: "Garage", required: true },
    mechanic: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    serviceCharges: { type: Number, default: 0 },
    sparePartsCost: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    paymentStatus: { type: String, default: "pending" }
}, { timestamps: true });

module.exports = mongoose.model("Invoice", invoiceSchema);