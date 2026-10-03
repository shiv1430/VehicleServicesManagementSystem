const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    durationMinutes: { type: Number, default: 60 }
}, { _id: true });

const garageSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    referenceCode: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
    address: { type: String, required: true },
    phone: String,
    description: String,
    services: [serviceSchema],
    mechanics: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    leadMechanic: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rating: { type: Number, default: 0 },
    verified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Garage", garageSchema);