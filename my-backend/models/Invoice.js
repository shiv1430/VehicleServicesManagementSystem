const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ["service", "part", "labour", "other"],
        default: "service"
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        unique: true,
        sparse: true,
        uppercase: true,
        trim: true
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: true,
        unique: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    garage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Garage",
        required: true
    },
    mechanic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
        required: true
    },
    status: {
        type: String,
        enum: ["draft", "finalized", "paid"],
        default: "draft"
    },
    items: [invoiceItemSchema],
    labourCharges: {
        type: Number,
        default: 0,
        min: 0
    },
    otherCharges: {
        type: Number,
        default: 0,
        min: 0
    },
    subtotal: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    taxableAmount: {
        type: Number,
        default: 0
    },
    gstPercentage: {
        type: Number,
        default: 18,
        min: 0,
        max: 28
    },
    cgstAmount: {
        type: Number,
        default: 0
    },
    sgstAmount: {
        type: Number,
        default: 0
    },
    gstAmount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    // Legacy fields preserved for backward compatibility
    serviceCharges: {
        type: Number,
        default: 0
    },
    sparePartsCost: {
        type: Number,
        default: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        default: 0
    },
    paymentStatus: {
        type: String,
        default: "pending"
    },
    notes: {
        type: String,
        trim: true
    },
    finalizedAt: {
        type: Date
    },
    finalizedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

invoiceSchema.index({ customer: 1, createdAt: -1 });
invoiceSchema.index({ garage: 1, createdAt: -1 });

module.exports = mongoose.model("Invoice", invoiceSchema);