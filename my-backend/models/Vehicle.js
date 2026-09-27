const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vehicleNumber: { type: String, required: true },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    fuelType: { type: String, required: true },
    manufacturingYear: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Vehicle", vehicleSchema);