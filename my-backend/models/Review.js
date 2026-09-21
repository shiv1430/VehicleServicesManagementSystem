const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    garage: { type: mongoose.Schema.Types.ObjectId, ref: "Garage", required: true },
    rating: { type: Number, required: true },
    comment: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);