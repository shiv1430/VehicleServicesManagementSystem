const crypto = require("crypto");
const Garage = require("../models/Garage");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const Invoice = require("../models/Invoice");
const Notification = require("../models/Notification");
const Message = require("../models/Message");
const User = require("../models/User");
const { buildInvoicePdf } = require("../services/pdfService");

// Helper to generate unique invoice number
const generateUniqueInvoiceNumber = async () => {
    let num = "";
    let isUnique = false;
    let attempts = 0;
    const year = new Date().getFullYear();
    while (!isUnique && attempts < 10) {
        attempts++;
        num = `INV-${year}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
        const existing = await Invoice.findOne({ invoiceNumber: num });
        if (!existing) {
            isUnique = true;
        }
    }
    return num;
};

// Show garages to users without login (Public)
const discoverGarages = async (req, res) => {
    try {
        const filter = {};

        if (req.query.service) {
            filter["services.name"] = new RegExp(req.query.service, "i");
        }

        if (req.query.search) {
            filter.$or = [
                { name: new RegExp(req.query.search, "i") },
                { address: new RegExp(req.query.search, "i") }
            ];
        }

        const garages = await Garage.find(filter)
            .populate("mechanics", "name mobile role skills");

        return res.json(garages);

    } catch (error) {
        return res.status(500).json({ message: "Server error while getting garages: " + error.message });
    }
};

// Get one garage by ID (Public)
const getGarage = async (req, res) => {
    try {
        const garage = await Garage.findById(req.params.id)
            .populate("mechanics", "name mobile role skills")
            .populate("leadMechanic", "name mobile role skills");

        if (!garage) {
            return res.status(404).json({ message: "Garage not found" });
        }

        return res.json(garage);

    } catch (error) {
        return res.status(500).json({ message: "Server error while getting garage" });
    }
};

// Customer can write a review for a completed booking
const createReview = async (req, res) => {
    try {
        const booking = await Booking.findOne({
            _id: req.body.booking,
            customer: req.user._id,
            status: "completed"
        });

        if (!booking) {
            return res.status(400).json({ message: "Only completed bookings can be reviewed" });
        }

        const review = new Review({
            booking: req.body.booking,
            customer: req.user._id,
            garage: booking.garage,
            rating: req.body.rating,
            comment: req.body.comment
        });

        const savedReview = await review.save();
        return res.status(201).json(savedReview);

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "This booking has already been reviewed" });
        }
        return res.status(500).json({ message: "Server error while creating review" });
    }
};

// Get reviews for a garage
const listReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ garage: req.params.garageId }).populate("customer", "name");
        return res.json(reviews);
    } catch (error) {
        return res.status(500).json({ message: "Server error while getting reviews" });
    }
};

// Update a review written by the logged-in customer
const updateReview = async (req, res) => {
    try {
        const review = await Review.findOne({ _id: req.params.id, customer: req.user._id });
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        if (req.body.rating) {
            review.rating = req.body.rating;
        }

        if (req.body.comment) {
            review.comment = req.body.comment;
        }

        const updatedReview = await review.save();
        return res.json(updatedReview);

    } catch (error) {
        return res.status(500).json({ message: "Server error while updating review" });
    }
};

// Delete a review written by the logged-in customer
const deleteReview = async (req, res) => {
    try {
        const review = await Review.findOne({ _id: req.params.id, customer: req.user._id });
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        await review.deleteOne();
        return res.json({ message: "Review deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: "Server error while deleting review" });
    }
};

// List notifications for the logged-in user
const listNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 });
        return res.json(notifications);
    } catch (error) {
        return res.status(500).json({ message: "Server error while getting notifications" });
    }
};

// Mark notification as read
const markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        notification.read = true;
        const updatedNotification = await notification.save();
        return res.json(updatedNotification);

    } catch (error) {
        return res.status(500).json({ message: "Server error while updating notification" });
    }
};

// Get chat messages for a booking (Strict Authorization: Customer, Assigned Mechanic, Garage Owner, Lead Mechanic)
const listMessages = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const garage = await Garage.findById(booking.garage);
        const isCustomer = booking.customer.toString() === req.user._id.toString();
        const isMechanic = booking.mechanic && booking.mechanic.toString() === req.user._id.toString();
        const isGarageOwner = garage && garage.owner.toString() === req.user._id.toString();
        const isLeadMechanic = garage && garage.leadMechanic && garage.leadMechanic.toString() === req.user._id.toString();

        if (!isCustomer && !isMechanic && !isGarageOwner && !isLeadMechanic && req.user.role !== "admin") {
            return res.status(403).json({ message: "Chat access denied" });
        }

        const messages = await Message.find({ booking: booking._id })
            .populate("sender", "name role")
            .sort({ createdAt: 1 });

        return res.json(messages);

    } catch (error) {
        return res.status(500).json({ message: "Server error while getting messages" });
    }
};

// Send a chat message for a booking
const sendMessage = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const garage = await Garage.findById(booking.garage);
        const isCustomer = booking.customer.toString() === req.user._id.toString();
        const isMechanic = booking.mechanic && booking.mechanic.toString() === req.user._id.toString();
        const isGarageOwner = garage && garage.owner.toString() === req.user._id.toString();
        const isLeadMechanic = garage && garage.leadMechanic && garage.leadMechanic.toString() === req.user._id.toString();

        if (!isCustomer && !isMechanic && !isGarageOwner && !isLeadMechanic && req.user.role !== "admin") {
            return res.status(403).json({ message: "Chat access denied" });
        }

        const text = req.body.text;
        const imageUrl = req.body.imageUrl;

        if (!text && !imageUrl) {
            return res.status(400).json({ message: "Message text or image is required" });
        }

        let recipient = booking.customer;
        if (isCustomer) {
            recipient = booking.mechanic || (garage ? garage.owner : booking.customer);
        }

        const message = new Message({
            booking: booking._id,
            sender: req.user._id,
            recipient: recipient,
            text: text,
            imageUrl: imageUrl
        });

        const savedMessage = await message.save();
        const populated = await Message.findById(savedMessage._id).populate("sender", "name role");

        return res.status(201).json(populated);

    } catch (error) {
        return res.status(500).json({ message: "Server error while sending message" });
    }
};

// ==========================================
// PROFESSIONAL INVOICE & BILLING CONTROLLER
// ==========================================

// Create or draft an invoice for a booking (Assigned Mechanic, Lead Mechanic, or Garage Owner)
const createOrDraftInvoice = async (req, res) => {
    try {
        const bookingId = req.body.bookingId || req.body.booking;
        if (!bookingId) {
            return res.status(400).json({ message: "Booking ID is required" });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const garage = await Garage.findById(booking.garage);
        if (!garage) {
            return res.status(404).json({ message: "Garage not found" });
        }

        // Authorization: Customer CANNOT create invoice
        if (req.user.role === "customer" && req.user.role !== "admin") {
            return res.status(403).json({ message: "Customers are not permitted to create invoices" });
        }

        const isOwner = garage.owner.toString() === req.user._id.toString();
        const isAssigned = booking.mechanic && booking.mechanic.toString() === req.user._id.toString();
        const isLead = garage.leadMechanic && garage.leadMechanic.toString() === req.user._id.toString();

        if (!isOwner && !isAssigned && !isLead && req.user.role !== "admin") {
            return res.status(403).json({ message: "Only the assigned mechanic or garage owner can prepare the service bill" });
        }

        // Validate line items
        const rawItems = Array.isArray(req.body.items) ? req.body.items : [];
        const calculatedItems = [];
        let partsTotal = 0;
        let servicesTotal = 0;

        for (const item of rawItems) {
            const desc = item.description ? String(item.description).trim() : "";
            if (!desc) {
                return res.status(400).json({ message: "Each line item must have a valid description" });
            }

            const qty = Number(item.quantity);
            if (isNaN(qty) || qty <= 0) {
                return res.status(400).json({ message: "Line item quantity must be greater than zero" });
            }

            const unitPrice = Number(item.unitPrice);
            if (isNaN(unitPrice) || unitPrice < 0) {
                return res.status(400).json({ message: "Line item unit price cannot be negative" });
            }

            const category = ["service", "part", "labour", "other"].includes(item.category) ? item.category : "service";
            const amount = Math.round(qty * unitPrice * 100) / 100;

            if (category === "part") {
                partsTotal += amount;
            } else {
                servicesTotal += amount;
            }

            calculatedItems.push({
                description: desc,
                category,
                quantity: qty,
                unitPrice,
                amount
            });
        }

        // If no items were sent, use default booking service item
        if (calculatedItems.length === 0) {
            const basePrice = booking.service?.price || 0;
            calculatedItems.push({
                description: booking.service?.name || "Standard Vehicle Service",
                category: "service",
                quantity: 1,
                unitPrice: basePrice,
                amount: basePrice
            });
            servicesTotal += basePrice;
        }

        const labourCharges = Number(req.body.labourCharges) || 0;
        if (labourCharges < 0) {
            return res.status(400).json({ message: "Labour charges cannot be negative" });
        }

        const otherCharges = Number(req.body.otherCharges) || 0;
        if (otherCharges < 0) {
            return res.status(400).json({ message: "Other charges cannot be negative" });
        }

        const itemsSum = calculatedItems.reduce((acc, it) => acc + it.amount, 0);
        const subtotal = Math.round((itemsSum + labourCharges + otherCharges) * 100) / 100;

        const discount = Number(req.body.discount) || 0;
        if (discount < 0) {
            return res.status(400).json({ message: "Discount cannot be negative" });
        }
        if (discount > subtotal) {
            return res.status(400).json({ message: "Discount cannot exceed subtotal" });
        }

        const taxableAmount = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

        const gstPercentage = req.body.gstPercentage !== undefined ? Number(req.body.gstPercentage) : 18;
        if (isNaN(gstPercentage) || gstPercentage < 0 || gstPercentage > 28) {
            return res.status(400).json({ message: "Invalid GST percentage. Must be between 0% and 28%" });
        }

        const gstAmount = Math.round((taxableAmount * (gstPercentage / 100)) * 100) / 100;
        const cgstAmount = Math.round((gstAmount / 2) * 100) / 100;
        const sgstAmount = Math.round((gstAmount - cgstAmount) * 100) / 100;
        const totalAmount = Math.round((taxableAmount + gstAmount) * 100) / 100;

        const shouldFinalize = Boolean(req.body.finalize);

        // Check if invoice already exists for this booking
        let existingInvoice = await Invoice.findOne({ booking: booking._id });

        if (existingInvoice) {
            if (existingInvoice.status === "finalized") {
                return res.status(409).json({ message: "An invoice has already been finalized for this booking" });
            }

            // Update existing draft
            existingInvoice.items = calculatedItems;
            existingInvoice.labourCharges = labourCharges;
            existingInvoice.otherCharges = otherCharges;
            existingInvoice.subtotal = subtotal;
            existingInvoice.discount = discount;
            existingInvoice.taxableAmount = taxableAmount;
            existingInvoice.gstPercentage = gstPercentage;
            existingInvoice.cgstAmount = cgstAmount;
            existingInvoice.sgstAmount = sgstAmount;
            existingInvoice.gstAmount = gstAmount;
            existingInvoice.totalAmount = totalAmount;
            existingInvoice.serviceCharges = servicesTotal + labourCharges;
            existingInvoice.sparePartsCost = partsTotal;
            existingInvoice.tax = gstAmount;
            existingInvoice.total = totalAmount;
            existingInvoice.notes = req.body.notes !== undefined ? req.body.notes.trim() : existingInvoice.notes;

            if (shouldFinalize) {
                existingInvoice.status = "finalized";
                existingInvoice.finalizedAt = new Date();
                existingInvoice.finalizedBy = req.user._id;

                booking.status = "completed";
                booking.completedAt = new Date();
                await booking.save();

                await Notification.create({
                    recipient: booking.customer,
                    type: "completed",
                    booking: booking._id,
                    message: `Service completed! Final bill #${existingInvoice.invoiceNumber} is now available.`
                });
            }

            await existingInvoice.save();

            const populated = await Invoice.findById(existingInvoice._id)
                .populate("booking garage mechanic vehicle customer");
            return res.json(populated);
        }

        // Create new invoice
        const invoiceNumber = await generateUniqueInvoiceNumber();

        const invoice = new Invoice({
            invoiceNumber,
            booking: booking._id,
            customer: booking.customer,
            garage: booking.garage,
            mechanic: booking.mechanic || req.user._id,
            vehicle: booking.vehicle,
            status: shouldFinalize ? "finalized" : "draft",
            items: calculatedItems,
            labourCharges,
            otherCharges,
            subtotal,
            discount,
            taxableAmount,
            gstPercentage,
            cgstAmount,
            sgstAmount,
            gstAmount,
            totalAmount,
            serviceCharges: servicesTotal + labourCharges,
            sparePartsCost: partsTotal,
            tax: gstAmount,
            total: totalAmount,
            paymentStatus: "pending",
            notes: req.body.notes ? req.body.notes.trim() : "",
            finalizedAt: shouldFinalize ? new Date() : undefined,
            finalizedBy: shouldFinalize ? req.user._id : undefined
        });

        const savedInvoice = await invoice.save();

        if (shouldFinalize) {
            booking.status = "completed";
            booking.completedAt = new Date();
            await booking.save();

            await Notification.create({
                recipient: booking.customer,
                type: "completed",
                booking: booking._id,
                message: `Service completed! Final bill #${invoiceNumber} is now available.`
            });
        }

        const result = await Invoice.findById(savedInvoice._id)
            .populate("booking garage mechanic vehicle customer");
        return res.status(201).json(result);

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "An invoice already exists for this booking" });
        }
        return res.status(500).json({ message: "Server error while saving invoice: " + error.message });
    }
};

// Finalize a draft invoice
const finalizeInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        const garage = await Garage.findById(invoice.garage);
        const isOwner = garage && garage.owner.toString() === req.user._id.toString();
        const isAssigned = invoice.mechanic && invoice.mechanic.toString() === req.user._id.toString();
        const isLead = garage && garage.leadMechanic && garage.leadMechanic.toString() === req.user._id.toString();

        if (!isOwner && !isAssigned && !isLead && req.user.role !== "admin") {
            return res.status(403).json({ message: "You are not authorized to finalize this invoice" });
        }

        if (invoice.status === "finalized") {
            return res.status(409).json({ message: "Invoice has already been finalized" });
        }

        invoice.status = "finalized";
        invoice.finalizedAt = new Date();
        invoice.finalizedBy = req.user._id;
        await invoice.save();

        // Update booking status
        const booking = await Booking.findById(invoice.booking);
        if (booking) {
            booking.status = "completed";
            booking.completedAt = new Date();
            await booking.save();

            await Notification.create({
                recipient: booking.customer,
                type: "completed",
                booking: booking._id,
                message: `Service completed! Final bill #${invoice.invoiceNumber} is now available.`
            });
        }

        const populated = await Invoice.findById(invoice._id)
            .populate("booking garage mechanic vehicle customer");

        return res.json(populated);

    } catch (error) {
        return res.status(500).json({ message: "Server error while finalizing invoice: " + error.message });
    }
};

// Get single invoice by ID
const getInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate("booking garage mechanic vehicle customer");

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        // Authorization Check
        const isCustomer = invoice.customer && invoice.customer._id.toString() === req.user._id.toString();

        const garage = await Garage.findById(invoice.garage);
        const isGarageOwner = garage && garage.owner.toString() === req.user._id.toString();
        const isMechanicMember = garage && garage.mechanics.some(m => m.toString() === req.user._id.toString());
        const isAssigned = invoice.mechanic && invoice.mechanic._id.toString() === req.user._id.toString();

        if (!isCustomer && !isGarageOwner && !isMechanicMember && !isAssigned && req.user.role !== "admin") {
            return res.status(403).json({ message: "You are not authorized to view this invoice" });
        }

        return res.json(invoice);

    } catch (error) {
        return res.status(500).json({ message: "Server error while getting invoice: " + error.message });
    }
};

// Get invoice for a specific booking
const getInvoiceByBooking = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ booking: req.params.bookingId })
            .populate("booking garage mechanic vehicle customer");

        if (!invoice) {
            return res.status(404).json({ message: "No invoice found for this booking" });
        }

        // Authorization check
        const isCustomer = invoice.customer && invoice.customer._id.toString() === req.user._id.toString();
        const garage = await Garage.findById(invoice.garage);
        const isGarageOwner = garage && garage.owner.toString() === req.user._id.toString();
        const isMechanicMember = garage && garage.mechanics.some(m => m.toString() === req.user._id.toString());

        if (!isCustomer && !isGarageOwner && !isMechanicMember && req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        return res.json(invoice);
    } catch (error) {
        return res.status(500).json({ message: "Server error while getting booking invoice" });
    }
};

// List invoices (Role-based)
const listInvoices = async (req, res) => {
    try {
        let filter = {};

        if (req.user.role === "customer") {
            filter.customer = req.user._id;
        } else if (req.user.role === "garage_owner") {
            const garages = await Garage.find({ owner: req.user._id }).select("_id");
            const garageIds = garages.map(g => g._id);
            filter.garage = { $in: garageIds };
        } else if (req.user.role === "mechanic") {
            const garages = await Garage.find({ mechanics: req.user._id }).select("_id");
            const garageIds = garages.map(g => g._id);
            filter.$or = [
                { mechanic: req.user._id },
                { garage: { $in: garageIds } }
            ];
        }

        const invoices = await Invoice.find(filter)
            .populate("booking garage mechanic vehicle customer")
            .sort({ createdAt: -1 });

        return res.json(invoices);

    } catch (error) {
        return res.status(500).json({ message: "Server error while getting invoices: " + error.message });
    }
};

// Download Invoice as PDF
const downloadInvoicePdf = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate("booking garage mechanic vehicle customer");

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        // Authorization check
        const isCustomer = invoice.customer && invoice.customer._id.toString() === req.user._id.toString();
        const garage = await Garage.findById(invoice.garage);
        const isGarageOwner = garage && garage.owner.toString() === req.user._id.toString();
        const isAssigned = invoice.mechanic && invoice.mechanic._id.toString() === req.user._id.toString();

        if (!isCustomer && !isGarageOwner && !isAssigned && req.user.role !== "admin") {
            return res.status(403).json({ message: "You are not authorized to download this invoice" });
        }

        const invoiceNum = invoice.invoiceNumber || `INV-${new Date().getFullYear()}-${String(invoice._id).slice(-6).toUpperCase()}`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Invoice-${invoiceNum}.pdf`);

        buildInvoicePdf(invoice, res);

    } catch (error) {
        return res.status(500).json({ message: "Server error while generating PDF: " + error.message });
    }
};

module.exports = {
    discoverGarages,
    getGarage,
    createReview,
    listReviews,
    updateReview,
    deleteReview,
    listNotifications,
    markNotificationRead,
    listMessages,
    sendMessage,
    createOrDraftInvoice,
    finalizeInvoice,
    getInvoice,
    getInvoiceByBooking,
    listInvoices,
    downloadInvoicePdf
};