const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: String,
    price: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, min: 1, default: 60 }
}, { _id: true });

const garageSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    location: { type: { type: String, enum: ["Point"], default: "Point" }, coordinates: { type: [Number], default: [0, 0] } },
    phone: String,
    description: String,
    services: [serviceSchema],
    mechanics: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    rating: { type: Number, min: 0, max: 5, default: 0 },
    verified: { type: Boolean, default: false }
}, { timestamps: true });

garageSchema.index({ location: "2dsphere" });
module.exports = mongoose.model("Garage", garageSchema);