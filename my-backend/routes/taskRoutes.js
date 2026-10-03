const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
    createTask,
    getBookingTasks,
    getMyTasks,
    updateTask
} = require("../controllers/taskController");

router.use(requireAuth);

// Booking specific task routes
router.post("/booking/:bookingId", createTask);
router.get("/booking/:bookingId", getBookingTasks);

// Mechanic tasks
router.get("/my-tasks", getMyTasks);

// Update single task
router.patch("/:taskId", updateTask);

module.exports = router;
