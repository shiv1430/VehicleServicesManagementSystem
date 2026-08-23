const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    garage: { type: mongoose.Schema.Types.ObjectId, ref: "Garage", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000 }
}, { timestamps: true });
module.exports = mongoose.model("Review", reviewSchema);