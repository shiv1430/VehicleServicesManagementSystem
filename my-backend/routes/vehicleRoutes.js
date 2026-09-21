const express = require("express");
const router = express.Router();
const { requireAuth, allowRoles } = require("../middleware/auth");
const {
    listVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle
} = require("../controllers/vehicleController");

// Every vehicle route needs login
router.use(requireAuth);

// Customers can view and manage their own vehicles
router.get("/", allowRoles("customer"), listVehicles);
router.post("/", allowRoles("customer"), addVehicle);
router.put("/:id", allowRoles("customer"), updateVehicle);
router.delete("/:id", allowRoles("customer"), deleteVehicle);

module.exports = router;