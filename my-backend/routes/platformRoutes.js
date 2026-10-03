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
    createOrDraftInvoice,
    finalizeInvoice,
    getInvoice,
    getInvoiceByBooking,
    listInvoices,
    downloadInvoicePdf
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

// Booking Chat
router.get("/chat/:bookingId", listMessages);
router.post("/chat/:bookingId", sendMessage);

// Professional Invoices & Billing
router.get("/invoices", listInvoices);
router.get("/invoices/booking/:bookingId", getInvoiceByBooking);
router.get("/invoices/:id/download", downloadInvoicePdf);
router.get("/invoices/:id/pdf", downloadInvoicePdf);
router.get("/invoices/:id", getInvoice);
router.post("/invoices", createOrDraftInvoice);
router.patch("/invoices/:id/finalize", finalizeInvoice);

module.exports = router;