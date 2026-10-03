const mongoose = require("mongoose");

const serviceTaskSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: true
    },
    garage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Garage",
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "in_progress", "completed"],
        default: "pending"
    },
    completedAt: {
        type: Date
    }
}, { timestamps: true });

serviceTaskSchema.index({ booking: 1 });
serviceTaskSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model("ServiceTask", serviceTaskSchema);
