const mongoose = require("mongoose");

const garageJoinRequestSchema = new mongoose.Schema({
    garage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Garage",
        required: true
    },
    mechanic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    skills: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    resolvedAt: {
        type: Date
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

garageJoinRequestSchema.index({ garage: 1, mechanic: 1, status: 1 });

module.exports = mongoose.model("GarageJoinRequest", garageJoinRequestSchema);
