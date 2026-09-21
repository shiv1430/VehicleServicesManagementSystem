const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const Garage = require("../models/Garage");
const Invoice = require("../models/Invoice");
const Notification = require("../models/Notification");

// Get bookings based on the logged-in user's role
const listBookings = async (req, res) => {
    try {
        let filter = {};

        if (req.user.role === "customer") {
            filter.customer = req.user._id;
        } else if (req.user.role === "garage_owner") {
            const garages = await Garage.find({ owner: req.user._id }).select("_id");
            const garageIds = garages.map(garage => garage._id);
            filter.garage = { $in: garageIds };
        } else if (req.user.role === "mechanic") {
            filter.mechanic = req.user._id;
        }

        const bookings = await Booking
            .find(filter)
            .sort({ appointmentAt: 1 })
            .populate("vehicle garage mechanic customer", "name email mobile brand model vehicleNumber address");

        return res.json(bookings);

    } catch (error) {
        return res.status(500).json({ message: "Server error while getting bookings" });
    }
};

// Create a booking for a vehicle at a specific garage
const createBooking = async (req, res) => {
    try {
        const vehicleId = req.body.vehicle;
        const garageId = req.body.garage;
        const mechanicId = req.body.mechanic;
        const serviceName = req.body.service;
        const appointmentAt = req.body.appointmentAt;
        const notes = req.body.notes;

        if (!vehicleId || !garageId || !serviceName || !appointmentAt) {
            return res.status(400).json({ message: "Vehicle, garage, service and appointment time are required" });
        }

        // Check if vehicle belongs to customer
        const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: req.user._id });
        if (!vehicle) {
            return res.status(400).json({ message: "Vehicle does not belong to this customer" });
        }

        // Check if garage exists
        const garage = await Garage.findById(garageId);
        if (!garage) {
            return res.status(404).json({ message: "Garage not found" });
        }

        // Check if appointment is in the future
        const appointmentDate = new Date(appointmentAt);
        if (appointmentDate <= new Date()) {
            return res.status(400).json({ message: "Appointment must be in the future" });
        }

        // Find the service in garage's services list
        let selectedService = null;
        for (let i = 0; i < garage.services.length; i++) {
            if (garage.services[i].name === serviceName) {
                selectedService = garage.services[i];
                break;
            }
        }

        if (!selectedService) {
            return res.status(400).json({ message: "This service is not offered by this garage" });
        }

        // Create booking
        const booking = new Booking({
            customer: req.user._id,
            vehicle: vehicleId,
            garage: garageId,
            mechanic: mechanicId,
            service: {
                name: selectedService.name,
                price: selectedService.price
            },
            appointmentAt: appointmentDate,
            notes: notes,
            status: "pending"
        });

        const savedBooking = await booking.save();
        
        // Get the booking with populated fields
        const result = await Booking.findById(savedBooking._id)
            .populate("vehicle garage mechanic customer", "name email mobile brand model vehicleNumber address");

        return res.status(201).json(result);

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "That appointment slot is already booked" });
        }

        return res.status(500).json({ message: "Server error while creating booking" });
    }
};

// Update booking status or appointment details
const updateBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Check if user has permission to update this booking
        const isCustomer = booking.customer.toString() === req.user._id.toString();
        const isMechanic = booking.mechanic && booking.mechanic.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";

        let isGarageOwner = false;
        if (req.user.role === "garage_owner") {
            const garage = await Garage.findById(booking.garage);
            isGarageOwner = garage && garage.owner.toString() === req.user._id.toString();
        }

        const canUpdate = isCustomer || isMechanic || isGarageOwner || isAdmin;

        if (!canUpdate) {
            return res.status(403).json({ message: "You cannot update this booking" });
        }

        // Update fields if provided
        if (req.body.status) {
            booking.status = req.body.status;
        }

        if (req.body.appointmentAt) {
            booking.appointmentAt = req.body.appointmentAt;
        }

        if (req.body.notes) {
            booking.notes = req.body.notes;
        }

        const updatedBooking = await booking.save();

        // Create notification when booking is confirmed or completed
        if (req.body.status === "confirmed" || req.body.status === "completed") {
            const message = req.body.status === "completed"
                ? "Your service is completed"
                : "Your booking has been confirmed";

            await Notification.create({
                recipient: booking.customer,
                type: req.body.status === "completed" ? "completed" : "booking",
                booking: booking._id,
                message: message
            });
        }

        // Create invoice when booking is completed
        if (req.body.status === "completed") {
            const invoice = await Invoice.findOne({ booking: booking._id });
            
            if (!invoice) {
                await Invoice.create({
                    booking: booking._id,
                    customer: booking.customer,
                    garage: booking.garage,
                    mechanic: booking.mechanic,
                    vehicle: booking.vehicle,
                    serviceCharges: booking.service.price || 0,
                    total: booking.service.price || 0
                });
            }
        }

        // Get the updated booking with populated fields
        const result = await Booking.findById(updatedBooking._id)
            .populate("vehicle garage mechanic customer", "name email mobile brand model vehicleNumber address");

        return res.json(result);

    } catch (error) {
        return res.status(500).json({ message: "Server error while updating booking" });
    }
};

module.exports = {
    listBookings,
    createBooking,
    updateBooking
};