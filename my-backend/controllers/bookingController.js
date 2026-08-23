const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const Garage = require("../models/Garage");
const Invoice = require("../models/Invoice");
const Notification = require("../models/Notification");

const populateBooking = (query) => query.populate("vehicle garage mechanic customer", "name email mobile brand model vehicleNumber address");
const listBookings = async (req, res) => {
    let filter;
    if (req.user.role === "customer") filter = { customer: req.user._id };
    else if (req.user.role === "garage_owner") {
        const garages = await Garage.find({ owner: req.user._id }).select("_id");
        filter = { garage: { $in: garages.map((garage) => garage._id) } };
    } else if (req.user.role === "admin") filter = {};
    else filter = { mechanic: req.user._id };
    res.json(await populateBooking(Booking.find(filter).sort({ appointmentAt: 1 })));
};
const createBooking = async (req, res) => {
    try {
        const { vehicle, garage, mechanic, service, appointmentAt, notes } = req.body;
        const ownedVehicle = await Vehicle.findOne({ _id: vehicle, owner: req.user._id });
        if (!ownedVehicle) return res.status(400).json({ message: "Vehicle does not belong to customer" });
        const selectedGarage = await Garage.findById(garage);
        if (!selectedGarage) return res.status(404).json({ message: "Garage not found" });
        if (new Date(appointmentAt) <= new Date()) return res.status(400).json({ message: "Appointment must be in the future" });
        const selectedService = selectedGarage.services.id(service) || selectedGarage.services.find((item) => item.name === service);
        if (!selectedService) return res.status(400).json({ message: "Service is not offered by this garage" });
        const booking = await Booking.create({ customer: req.user._id, vehicle, garage, mechanic, service: { name: selectedService.name, price: selectedService.price }, appointmentAt, notes });
        res.status(201).json(await populateBooking(Booking.findById(booking._id)));
    } catch (error) { res.status(error.code === 11000 ? 409 : 400).json({ message: error.code === 11000 ? "That appointment slot is already booked" : error.message }); }
};
const updateBooking = async (req, res) => {
    const update = {};
    if (req.body.status) update.status = req.body.status;
    if (req.body.appointmentAt) update.appointmentAt = req.body.appointmentAt;
    if (req.body.progressStatus) update.progressStatus = req.body.progressStatus;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    const garage = await Garage.findById(booking.garage).select("owner");
    const ownsGarage = garage?.owner.equals(req.user._id);
    const isCustomer = booking.customer.equals(req.user._id);
    const isMechanic = booking.mechanic?.equals(req.user._id);
    const allowed = isCustomer || isMechanic || ownsGarage || req.user.role === "admin";
    if (!allowed) return res.status(403).json({ message: "You cannot update this booking" });
    if (isCustomer && (req.body.progressStatus || !["cancelled"].includes(req.body.status))) return res.status(403).json({ message: "Customers can only cancel bookings" });
    if (!isCustomer && !isMechanic && !ownsGarage && req.user.role !== "admin") return res.status(403).json({ message: "You cannot update this booking" });
    if (update.progressStatus) update.statusHistory = [...booking.statusHistory, { status: update.progressStatus, changedBy: req.user._id }];
    if (update.progressStatus === "Completed") { update.status = "completed"; update.completedAt = new Date(); }
    const updated = await Booking.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (update.status === "confirmed" || update.progressStatus === "Completed") {
        await Notification.create({ recipient: booking.customer, type: update.progressStatus === "Completed" ? "completed" : "booking", booking: booking._id, message: update.progressStatus === "Completed" ? "Your service is completed" : "Your booking has been confirmed" });
    }
    if (update.progressStatus === "Completed") {
        await Invoice.findOneAndUpdate({ booking: booking._id }, { $setOnInsert: { booking: booking._id, customer: booking.customer, garage: booking.garage, mechanic: booking.mechanic, vehicle: booking.vehicle, serviceCharges: booking.service?.price || 0, total: booking.service?.price || 0 } }, { upsert: true, new: true });
    }
    res.json(await populateBooking(Booking.findById(updated._id)));
};
module.exports = { listBookings, createBooking, updateBooking };