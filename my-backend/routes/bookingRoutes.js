const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
    listBookings,
    createBooking,
    updateBooking
} = require("../controllers/bookingController");

// Booking routes require login
router.use(requireAuth);

router.get("/", listBookings);
router.post("/", createBooking);
router.patch("/:id", updateBooking);

module.exports = router;