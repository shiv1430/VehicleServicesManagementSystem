const Garage = require("../models/Garage");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const Invoice = require("../models/Invoice");
const Notification = require("../models/Notification");
const Message = require("../models/Message");

// Show garages to users without login
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

        const garages = await Garage.find(filter).populate("mechanics", "name mobile role");

        return res.json(garages);

    } catch (error) {
        return res.status(500).json({ message: "Server error while getting garages" });
    }
};

// Get one garage by ID
const getGarage = async (req, res) => {
    try {
        const garage = await Garage.findById(req.params.id).populate("mechanics", "name mobile role");

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

// Get chat messages for a booking
const listMessages = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const isCustomer = booking.customer.toString() === req.user._id.toString();
        const isMechanic = booking.mechanic && booking.mechanic.toString() === req.user._id.toString();

        if (!isCustomer && !isMechanic && req.user.role !== "admin") {
            return res.status(403).json({ message: "Chat access denied" });
        }

        const messages = await Message.find({ booking: booking._id }).populate("sender", "name role").sort({ createdAt: 1 });

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

        const isCustomer = booking.customer.toString() === req.user._id.toString();
        const isMechanic = booking.mechanic && booking.mechanic.toString() === req.user._id.toString();

        if (!isCustomer && !isMechanic) {
            return res.status(403).json({ message: "Chat access denied" });
        }

        const text = req.body.text;
        const imageUrl = req.body.imageUrl;

        if (!text && !imageUrl) {
            return res.status(400).json({ message: "Message text or image is required" });
        }

        const recipient = isCustomer ? booking.mechanic : booking.customer;

        const message = new Message({
            booking: booking._id,
            sender: req.user._id,
            recipient: recipient,
            text: text,
            imageUrl: imageUrl
        });

        const savedMessage = await message.save();

        return res.status(201).json(savedMessage);

    } catch (error) {
        return res.status(500).json({ message: "Server error while sending message" });
    }
};

// List invoices for the logged-in customer
const listInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find({ customer: req.user._id }).populate("booking garage mechanic vehicle");
        return res.json(invoices);
    } catch (error) {
        return res.status(500).json({ message: "Server error while getting invoices" });
    }
};

// Download one invoice for the logged-in customer
const getInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ _id: req.params.id, customer: req.user._id }).populate("booking garage mechanic vehicle customer");

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        res.set("Content-Disposition", "attachment; filename=invoice-" + invoice._id + ".json");
        return res.json(invoice);

    } catch (error) {
        return res.status(500).json({ message: "Server error while getting invoice" });
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
    listInvoices,
    getInvoice
};