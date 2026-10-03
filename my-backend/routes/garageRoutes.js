const express = require("express");
const router = express.Router();
const { requireAuth, allowRoles } = require("../middleware/auth");
const {
    createGarage,
    listOwnedGarages,
    updateGarage,
    addMechanic,
    getMineMechanics,
    searchMechanicsBySkill,
    getJoinRequests,
    respondJoinRequest,
    setLeadMechanic
} = require("../controllers/garageController");

// Garage owner routes need login and garage_owner role
router.use(requireAuth);

router.get("/mine", allowRoles("garage_owner"), listOwnedGarages);
router.get("/mine/mechanics", allowRoles("garage_owner"), getMineMechanics);
router.get("/mine/mechanics/search", allowRoles("garage_owner"), searchMechanicsBySkill);
router.get("/mine/join-requests", allowRoles("garage_owner"), getJoinRequests);
router.patch("/mine/join-requests/:requestId", allowRoles("garage_owner"), respondJoinRequest);
router.patch("/mine/lead-mechanic", allowRoles("garage_owner"), setLeadMechanic);

router.post("/", allowRoles("garage_owner"), createGarage);
router.put("/:id", allowRoles("garage_owner"), updateGarage);
router.post("/:id/mechanics", allowRoles("garage_owner"), addMechanic);

module.exports = router;