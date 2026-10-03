const ServiceTask = require("../models/ServiceTask");
const Booking = require("../models/Booking");
const Garage = require("../models/Garage");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Create a task for a booking (Garage Owner or Lead Mechanic)
const createTask = async (req, res) => {
    try {
        const bookingId = req.params.bookingId || req.body.bookingId;
        const { title, description, assignedTo } = req.body;

        if (!bookingId || !title || !assignedTo) {
            return res.status(400).json({ message: "Booking ID, task title, and assigned mechanic are required" });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const garage = await Garage.findById(booking.garage);
        if (!garage) {
            return res.status(404).json({ message: "Garage not found" });
        }

        // Authorization check: Must be owner or lead mechanic of this garage
        const isOwner = garage.owner.toString() === req.user._id.toString();
        const isLead = garage.leadMechanic && garage.leadMechanic.toString() === req.user._id.toString();

        if (!isOwner && !isLead && req.user.role !== "admin") {
            return res.status(403).json({ message: "Only garage owner or lead mechanic can create service tasks" });
        }

        // Verify assigned mechanic is an active member in this garage
        const isMember = garage.mechanics.some(m => m.toString() === assignedTo.toString());
        if (!isMember) {
            return res.status(400).json({ message: "Assigned mechanic must belong to this garage" });
        }

        const task = new ServiceTask({
            booking: booking._id,
            garage: garage._id,
            title: title.trim(),
            description: description ? description.trim() : "",
            assignedTo,
            createdBy: req.user._id,
            status: "pending"
        });

        const savedTask = await task.save();

        // Notify assigned mechanic
        await Notification.create({
            recipient: assignedTo,
            type: "task",
            booking: booking._id,
            message: `New task assigned: "${title.trim()}" for booking #${booking._id}`
        });

        const populatedTask = await ServiceTask.findById(savedTask._id)
            .populate("assignedTo", "name email mobile skills")
            .populate("createdBy", "name role");

        return res.status(201).json(populatedTask);

    } catch (error) {
        return res.status(500).json({ message: "Server error while creating task: " + error.message });
    }
};

// Get all tasks for a specific booking
const getBookingTasks = async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Check if user is authorized to view this booking's tasks
        const isCustomer = booking.customer.toString() === req.user._id.toString();
        const isAssigned = booking.mechanic && booking.mechanic.toString() === req.user._id.toString();

        const garage = await Garage.findById(booking.garage);
        const isOwner = garage && garage.owner.toString() === req.user._id.toString();
        const isGarageMechanic = garage && garage.mechanics.some(m => m.toString() === req.user._id.toString());

        if (!isCustomer && !isAssigned && !isOwner && !isGarageMechanic && req.user.role !== "admin") {
            return res.status(403).json({ message: "You are not authorized to view tasks for this booking" });
        }

        const tasks = await ServiceTask.find({ booking: booking._id })
            .populate("assignedTo", "name email mobile skills")
            .populate("createdBy", "name role")
            .sort({ createdAt: 1 });

        return res.json(tasks);

    } catch (error) {
        return res.status(500).json({ message: "Server error while getting booking tasks: " + error.message });
    }
};

// Get all tasks assigned to the logged-in mechanic
const getMyTasks = async (req, res) => {
    try {
        if (req.user.role !== "mechanic") {
            return res.status(403).json({ message: "Only mechanics can view assigned tasks" });
        }

        const tasks = await ServiceTask.find({ assignedTo: req.user._id })
            .populate({
                path: "booking",
                populate: {
                    path: "vehicle customer",
                    select: "brand model vehicleNumber name mobile"
                }
            })
            .populate("garage", "name address phone")
            .populate("createdBy", "name role")
            .sort({ createdAt: -1 });

        return res.json(tasks);

    } catch (error) {
        return res.status(500).json({ message: "Server error while getting mechanic tasks: " + error.message });
    }
};

// Update task status (Assigned Mechanic only, or Garage Owner)
const updateTask = async (req, res) => {
    try {
        const task = await ServiceTask.findById(req.params.taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const isAssigned = task.assignedTo.toString() === req.user._id.toString();

        const garage = await Garage.findById(task.garage);
        const isOwner = garage && garage.owner.toString() === req.user._id.toString();
        const isLead = garage && garage.leadMechanic && garage.leadMechanic.toString() === req.user._id.toString();

        if (!isAssigned && !isOwner && !isLead && req.user.role !== "admin") {
            return res.status(403).json({ message: "You are only allowed to update tasks assigned to you" });
        }

        const allowedStatuses = ["pending", "in_progress", "completed"];
        if (req.body.status && !allowedStatuses.includes(req.body.status)) {
            return res.status(400).json({ message: "Status must be pending, in_progress, or completed" });
        }

        if (req.body.status) {
            task.status = req.body.status;
            if (req.body.status === "completed") {
                task.completedAt = new Date();
            } else {
                task.completedAt = undefined;
            }
        }

        if (req.body.title && (isOwner || isLead)) {
            task.title = req.body.title.trim();
        }

        if (req.body.description !== undefined && (isOwner || isLead)) {
            task.description = req.body.description.trim();
        }

        const updated = await task.save();

        const populated = await ServiceTask.findById(updated._id)
            .populate("assignedTo", "name email mobile skills")
            .populate("createdBy", "name role");

        return res.json(populated);

    } catch (error) {
        return res.status(500).json({ message: "Server error while updating task: " + error.message });
    }
};

module.exports = {
    createTask,
    getBookingTasks,
    getMyTasks,
    updateTask
};
