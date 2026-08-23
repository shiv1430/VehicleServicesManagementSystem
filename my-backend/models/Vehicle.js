const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vehicleNumber: { type: String, required: true, trim: true, uppercase: true },
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    fuelType: { type: String, enum: ["petrol", "diesel", "electric", "hybrid", "cng", "other"], required: true },
    manufacturingYear: { type: Number, required: true, min: 1886, max: new Date().getFullYear() }
}, { timestamps: true });

vehicleSchema.index({ owner: 1, vehicleNumber: 1 }, { unique: true });
module.exports = mongoose.model("Vehicle", vehicleSchema);