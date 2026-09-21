const express = require("express");
const router = express.Router();
const { requireAuth, allowRoles } = require("../middleware/auth");
const {
    createGarage,
    listOwnedGarages,
    updateGarage,
    addMechanic
} = require("../controllers/garageController");

// Garage owner routes need login and garage_owner role
router.use(requireAuth);

router.get("/mine", allowRoles("garage_owner"), listOwnedGarages);
router.post("/", allowRoles("garage_owner"), createGarage);
router.put("/:id", allowRoles("garage_owner"), updateGarage);
router.post("/:id/mechanics", allowRoles("garage_owner"), addMechanic);

module.exports = router;