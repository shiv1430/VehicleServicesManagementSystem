const Garage = require("../models/Garage");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const Invoice = require("../models/Invoice");
const Notification = require("../models/Notification");
const Message = require("../models/Message");

const discoverGarages = async (req, res) => {
    const filter = { verified: { $ne: false } };
    if (req.query.service) filter["services.name"] = new RegExp(req.query.service, "i");
    if (req.query.search) filter.$or = [{ name: new RegExp(req.query.search, "i") }, { address: new RegExp(req.query.search, "i") }];
    let query = Garage.find(filter).populate("mechanics", "name mobile role");
    if (req.query.lng && req.query.lat) query = Garage.find({ ...filter, location: { $near: { $geometry: { type: "Point", coordinates: [Number(req.query.lng), Number(req.query.lat)] } } } }).populate("mechanics", "name mobile role");
    res.json(await query);
};
const getGarage = async (req, res) => {
    const garage = await Garage.findById(req.params.id).populate("mechanics", "name mobile role");
    if (!garage) return res.status(404).json({ message: "Garage not found" });
    res.json(garage);
};
const createReview = async (req, res) => {
    const booking = await Booking.findOne({ _id: req.body.booking, customer: req.user._id, status: "completed" });
    if (!booking) return res.status(400).json({ message: "Only completed bookings can be reviewed" });
    try { res.status(201).json(await Review.create({ ...req.body, customer: req.user._id, garage: booking.garage })); }
    catch (error) { res.status(error.code === 11000 ? 409 : 400).json({ message: error.code === 11000 ? "Booking already reviewed" : error.message }); }
};
const listReviews = async (req, res) => res.json(await Review.find({ garage: req.params.garageId }).populate("customer", "name"));
const updateReview = async (req, res) => {
    const review = await Review.findOneAndUpdate({ _id: req.params.id, customer: req.user._id }, req.body, { new: true, runValidators: true });
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json(review);
};
const deleteReview = async (req, res) => {
    const review = await Review.findOneAndDelete({ _id: req.params.id, customer: req.user._id });
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json({ message: "Review deleted" });
};
const listNotifications = async (req, res) => res.json(await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }));
const markNotificationRead = async (req, res) => res.json(await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { read: true }, { new: true }));
const listMessages = async (req, res) => {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking || (![booking.customer, booking.mechanic].some((id) => id?.equals(req.user._id)) && req.user.role !== "admin")) return res.status(403).json({ message: "Chat access denied" });
    res.json(await Message.find({ booking: booking._id }).populate("sender", "name role").sort({ createdAt: 1 }));
};
const sendMessage = async (req, res) => {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    const participants = [booking.customer, booking.mechanic].filter(Boolean);
    if (!participants.some((id) => id.equals(req.user._id))) return res.status(403).json({ message: "Chat access denied" });
    const recipient = participants.find((id) => !id.equals(req.user._id));
    if (!req.body.text && !req.body.imageUrl) return res.status(400).json({ message: "Message text or image is required" });
    res.status(201).json(await Message.create({ booking: booking._id, sender: req.user._id, recipient, text: req.body.text, imageUrl: req.body.imageUrl }));
};
const listInvoices = async (req, res) => res.json(await Invoice.find({ customer: req.user._id }).populate("booking garage mechanic vehicle"));
const getInvoice = async (req, res) => {
    const invoice = await Invoice.findOne({ _id: req.params.id, customer: req.user._id }).populate("booking garage mechanic vehicle customer");
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.set("Content-Disposition", `attachment; filename=invoice-${invoice._id}.json`);
    res.json(invoice);
};
module.exports = { discoverGarages, getGarage, createReview, listReviews, updateReview, deleteReview, listNotifications, markNotificationRead, listMessages, sendMessage, listInvoices, getInvoice };