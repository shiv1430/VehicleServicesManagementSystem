const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true, maxlength: 5000 },
    imageUrl: String
}, { timestamps: true });
module.exports = mongoose.model("Message", messageSchema);