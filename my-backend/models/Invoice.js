const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    garage: { type: mongoose.Schema.Types.ObjectId, ref: "Garage", required: true },
    mechanic: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    serviceCharges: { type: Number, min: 0, default: 0 },
    sparePartsCost: { type: Number, min: 0, default: 0 },
    tax: { type: Number, min: 0, default: 0 },
    total: { type: Number, min: 0, default: 0 },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    aiServiceSummary: { type: String, maxlength: 3000 }
}, { timestamps: true });
module.exports = mongoose.model("Invoice", invoiceSchema);