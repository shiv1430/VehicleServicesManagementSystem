const express = require("express");
const { requireAuth } = require("../middleware/auth");
const controller = require("../controllers/bookingController");
const router = express.Router();
router.use(requireAuth);
router.get("/", controller.listBookings);
router.post("/", controller.createBooking);
router.patch("/:id", controller.updateBooking);
module.exports = router;