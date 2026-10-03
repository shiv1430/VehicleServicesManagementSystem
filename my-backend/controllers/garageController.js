const crypto = require("crypto");
const Garage = require("../models/Garage");
const User = require("../models/User");
const GarageJoinRequest = require("../models/GarageJoinRequest");
const Booking = require("../models/Booking");

// Helper to generate a unique garage reference code
const generateUniqueGarageCode = async () => {
    let code = "";
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
        attempts++;
        code = "GAR-" + crypto.randomBytes(3).toString("hex").toUpperCase();
        const existing = await Garage.findOne({ referenceCode: code });
        if (!existing) {
            isUnique = true;
        }
    }
    return code;
};

// Create a garage owned by the logged-in garage owner
const createGarage = async (req, res) => {
    try {
        const referenceCode = await generateUniqueGarageCode();

        const newGarage = new Garage({
            owner: req.user._id,
            name: req.body.name,
            referenceCode,
            address: req.body.address,
            phone: req.body.phone,
            description: req.body.description,
            services: req.body.services,
            verified: req.body.verified || false
        });

        const savedGarage = await newGarage.save();
        return res.status(201).json(savedGarage);

    } catch (error) {
        return res.status(500).json({ message: "Server error while creating garage: " + error.message });
    }
};

// Get all garages owned by this garage owner
const listOwnedGarages = async (req, res) => {
    try {
        const garages = await Garage.find({ owner: req.user._id })
            .populate("mechanics", "name email mobile skills membershipStatus")
            .populate("leadMechanic", "name email mobile skills");

        // Lazy migration: Ensure every existing owned garage has a unique referenceCode
        const enrichedGarages = await Promise.all(garages.map(async (g) => {
            if (!g.referenceCode) {
                g.referenceCode = await generateUniqueGarageCode();
                await g.save();
            }

            const pendingRequestsCount = await GarageJoinRequest.countDocuments({
                garage: g._id,
                status: "pending"
            });

            const activeBookingsCount = await Booking.countDocuments({
                garage: g._id,
                status: { $in: ["pending", "confirmed", "accepted", "in_progress"] }
            });

            const completedBookingsCount = await Booking.countDocuments({
                garage: g._id,
                status: "completed"
            });

            const garageObj = g.toObject();
            garageObj.pendingRequestsCount = pendingRequestsCount;
            garageObj.activeBookingsCount = activeBookingsCount;
            garageObj.completedBookingsCount = completedBookingsCount;
            return garageObj;
        }));

        return res.json(enrichedGarages);
    } catch (error) {
        return res.status(500).json({ message: "Server error while getting garages: " + error.message });
    }
};

// Update a garage owned by this garage owner
const updateGarage = async (req, res) => {
    try {
        const garage = await Garage.findOne({ _id: req.params.id, owner: req.user._id });

        if (!garage) {
            return res.status(404).json({ message: "Garage not found or unauthorized" });
        }

        if (req.body.name) {
            garage.name = req.body.name.trim();
        }

        if (req.body.address) {
            garage.address = req.body.address.trim();
        }

        if (req.body.phone) {
            garage.phone = req.body.phone.trim();
        }

        if (req.body.description !== undefined) {
            garage.description = req.body.description.trim();
        }

        if (req.body.services) {
            garage.services = req.body.services;
        }

        const updatedGarage = await garage.save();
        return res.json(updatedGarage);

    } catch (error) {
        return res.status(500).json({ message: "Server error while updating garage" });
    }
};

// Add a mechanic to a garage (legacy owner direct assignment)
const addMechanic = async (req, res) => {
    try {
        const mechanicId = req.body.mechanicId;

        if (!mechanicId) {
            return res.status(400).json({ message: "Mechanic ID is required" });
        }

        const mechanic = await User.findOne({ _id: mechanicId, role: "mechanic" });
        if (!mechanic) {
            return res.status(400).json({ message: "A valid mechanic is required" });
        }

        const garage = await Garage.findOne({ _id: req.params.id, owner: req.user._id });
        if (!garage) {
            return res.status(404).json({ message: "Garage not found or unauthorized" });
        }

        const alreadyAdded = garage.mechanics.some(m => m.toString() === mechanicId);
        if (alreadyAdded) {
            return res.status(400).json({ message: "Mechanic already added to this garage" });
        }

        garage.mechanics.push(mechanicId);
        await garage.save();

        mechanic.primaryGarage = garage._id;
        mechanic.membershipStatus = "active";
        await mechanic.save();

        const updatedGarage = await Garage.findById(garage._id)
            .populate("mechanics", "name email mobile skills")
            .populate("leadMechanic", "name email mobile skills");

        return res.json(updatedGarage);

    } catch (error) {
        return res.status(500).json({ message: "Server error while adding mechanic" });
    }
};

// Get list of active mechanics in owner's garage with workload
const getMineMechanics = async (req, res) => {
    try {
        const garage = await Garage.findOne({ owner: req.user._id })
            .populate("mechanics", "name email mobile skills membershipStatus")
            .populate("leadMechanic", "name email mobile skills");

        if (!garage) {
            return res.status(404).json({ message: "Garage not found" });
        }

        const mechanicsWithWorkload = await Promise.all(garage.mechanics.map(async (m) => {
            const activeJobsCount = await Booking.countDocuments({
                garage: garage._id,
                mechanic: m._id,
                status: { $in: ["confirmed", "accepted", "in_progress"] }
            });

            const isLead = garage.leadMechanic && garage.leadMechanic._id.toString() === m._id.toString();

            return {
                id: m._id,
                name: m.name,
                email: m.email,
                mobile: m.mobile,
                skills: m.skills || [],
                membershipStatus: m.membershipStatus,
                isLead: Boolean(isLead),
                activeJobsCount
            };
        }));

        return res.json(mechanicsWithWorkload);
    } catch (error) {
        return res.status(500).json({ message: "Server error while getting mechanics: " + error.message });
    }
};

// Search/filter active mechanics by skill
const searchMechanicsBySkill = async (req, res) => {
    try {
        const garage = await Garage.findOne({ owner: req.user._id })
            .populate("mechanics", "name email mobile skills membershipStatus")
            .populate("leadMechanic", "name email mobile skills");

        if (!garage) {
            return res.status(404).json({ message: "Garage not found" });
        }

        const querySkill = (req.query.skill || req.query.q || "").trim().toLowerCase();

        let filtered = garage.mechanics;
        if (querySkill) {
            filtered = garage.mechanics.filter(m =>
                (m.skills || []).some(s => s.toLowerCase().includes(querySkill))
            );
        }

        const results = await Promise.all(filtered.map(async (m) => {
            const activeJobsCount = await Booking.countDocuments({
                garage: garage._id,
                mechanic: m._id,
                status: { $in: ["confirmed", "accepted", "in_progress"] }
            });

            const isLead = garage.leadMechanic && garage.leadMechanic._id.toString() === m._id.toString();

            return {
                id: m._id,
                name: m.name,
                email: m.email,
                mobile: m.mobile,
                skills: m.skills || [],
                isLead: Boolean(isLead),
                activeJobsCount
            };
        }));

        return res.json(results);
    } catch (error) {
        return res.status(500).json({ message: "Server error while searching mechanics" });
    }
};

// Get pending join requests for owner's garage
const getJoinRequests = async (req, res) => {
    try {
        const garage = await Garage.findOne({ owner: req.user._id });
        if (!garage) {
            return res.status(404).json({ message: "Garage not found" });
        }

        const statusFilter = req.query.status || "pending";
        const filter = { garage: garage._id };
        if (statusFilter !== "all") {
            filter.status = statusFilter;
        }

        const requests = await GarageJoinRequest.find(filter)
            .populate("mechanic", "name email mobile skills")
            .sort({ requestedAt: -1 });

        return res.json(requests);
    } catch (error) {
        return res.status(500).json({ message: "Server error while getting join requests" });
    }
};

// Accept or reject a join request
const respondJoinRequest = async (req, res) => {
    try {
        const garage = await Garage.findOne({ owner: req.user._id });
        if (!garage) {
            return res.status(404).json({ message: "Garage not found or unauthorized" });
        }

        const request = await GarageJoinRequest.findOne({
            _id: req.params.requestId,
            garage: garage._id
        }).populate("mechanic");

        if (!request) {
            return res.status(404).json({ message: "Join request not found" });
        }

        if (request.status !== "pending") {
            return res.status(400).json({ message: `This request is already ${request.status}` });
        }

        const action = req.body.action; // "accept" or "reject"
        if (action !== "accept" && action !== "reject") {
            return res.status(400).json({ message: "Action must be 'accept' or 'reject'" });
        }

        request.status = action === "accept" ? "accepted" : "rejected";
        request.resolvedAt = new Date();
        request.resolvedBy = req.user._id;
        await request.save();

        const mechanic = await User.findById(request.mechanic._id);
        if (mechanic) {
            if (action === "accept") {
                mechanic.membershipStatus = "active";
                mechanic.primaryGarage = garage._id;
                await mechanic.save();

                // Add to garage mechanics list if not present
                const alreadyInGarage = garage.mechanics.some(m => m.toString() === mechanic._id.toString());
                if (!alreadyInGarage) {
                    garage.mechanics.push(mechanic._id);
                }

                // If makeLead flag passed or garage has no lead mechanic, designate as lead
                if (req.body.makeLead === true || (!garage.leadMechanic && garage.mechanics.length === 1)) {
                    garage.leadMechanic = mechanic._id;
                }

                await garage.save();
            } else {
                mechanic.membershipStatus = "rejected";
                await mechanic.save();
            }
        }

        return res.json({
            message: `Join request ${request.status} successfully`,
            request
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error while responding to join request: " + error.message });
    }
};

// Designate or remove lead mechanic
const setLeadMechanic = async (req, res) => {
    try {
        const garage = await Garage.findOne({ owner: req.user._id });
        if (!garage) {
            return res.status(404).json({ message: "Garage not found" });
        }

        const mechanicId = req.body.mechanicId;

        if (!mechanicId) {
            // Remove lead mechanic
            garage.leadMechanic = null;
            await garage.save();
            return res.json({ message: "Lead mechanic removed", leadMechanic: null });
        }

        // Verify mechanic belongs to this garage
        const isMember = garage.mechanics.some(m => m.toString() === mechanicId);
        if (!isMember) {
            return res.status(400).json({ message: "Selected mechanic is not an active member of this garage" });
        }

        garage.leadMechanic = mechanicId;
        await garage.save();

        const updated = await Garage.findById(garage._id).populate("leadMechanic", "name email mobile skills");
        return res.json({
            message: "Lead mechanic updated successfully",
            leadMechanic: updated.leadMechanic
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error while setting lead mechanic" });
    }
};

module.exports = {
    createGarage,
    listOwnedGarages,
    updateGarage,
    addMechanic,
    getMineMechanics,
    searchMechanicsBySkill,
    getJoinRequests,
    respondJoinRequest,
    setLeadMechanic
};