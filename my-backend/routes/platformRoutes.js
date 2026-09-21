const express = require("express");
const router = express.Router();
const { requireAuth, allowRoles } = require("../middleware/auth");
const {
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
} = require("../controllers/platformController");

// Public garage discovery routes
router.get("/garages", discoverGarages);
router.get("/garages/:id", getGarage);
router.get("/garages/:garageId/reviews", listReviews);

// Routes below need login
router.use(requireAuth);

router.post("/reviews", allowRoles("customer"), createReview);
router.put("/reviews/:id", allowRoles("customer"), updateReview);
router.delete("/reviews/:id", allowRoles("customer"), deleteReview);
router.get("/notifications", listNotifications);
router.patch("/notifications/:id/read", markNotificationRead);
router.get("/chat/:bookingId", listMessages);
router.post("/chat/:bookingId", sendMessage);
router.get("/invoices", allowRoles("customer"), listInvoices);
router.get("/invoices/:id/download", allowRoles("customer"), getInvoice);

module.exports = router;