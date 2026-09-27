const Garage = require("../models/Garage");
const User = require("../models/User");

// Create a garage owned by the logged-in garage owner
const createGarage = async (req, res) => {
    try {
        const newGarage = new Garage({
            owner: req.user._id,
            name: req.body.name,
            address: req.body.address,
            phone: req.body.phone,
            description: req.body.description,
            services: req.body.services,
            verified: req.body.verified || false
        });

        const savedGarage = await newGarage.save();

        return res.status(201).json(savedGarage);

    } catch (error) {
        return res.status(500).json({ message: "Server error while creating garage" });
    }
};

// Get all garages owned by this garage owner
const listOwnedGarages = async (req, res) => {
    try {
        const garages = await Garage.find({ owner: req.user._id }).populate("mechanics", "name email mobile");
        return res.json(garages);
    } catch (error) {
        return res.status(500).json({ message: "Server error while getting garages" });
    }
};

// Update a garage owned by this garage owner
const updateGarage = async (req, res) => {
    try {
        const garage = await Garage.findOne({ _id: req.params.id, owner: req.user._id });

        if (!garage) {
            return res.status(404).json({ message: "Garage not found" });
        }

        if (req.body.name) {
            garage.name = req.body.name;
        }

        if (req.body.address) {
            garage.address = req.body.address;
        }

        if (req.body.phone) {
            garage.phone = req.body.phone;
        }

        if (req.body.description) {
            garage.description = req.body.description;
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

// Add a mechanic to a garage
const addMechanic = async (req, res) => {
    try {
        const mechanicId = req.body.mechanicId;

        if (!mechanicId) {
            return res.status(400).json({ message: "Mechanic ID is required" });
        }

        // Check if mechanic exists and has mechanic role
        const mechanic = await User.findOne({ _id: mechanicId, role: "mechanic" });
        if (!mechanic) {
            return res.status(400).json({ message: "A valid mechanic is required" });
        }

        // Check if garage exists and belongs to current user
        const garage = await Garage.findOne({ _id: req.params.id, owner: req.user._id });
        if (!garage) {
            return res.status(404).json({ message: "Garage not found" });
        }

        // Check if mechanic is already in this garage
        let alreadyAdded = false;
        for (let i = 0; i < garage.mechanics.length; i++) {
            if (garage.mechanics[i].toString() === mechanicId) {
                alreadyAdded = true;
                break;
            }
        }

        if (alreadyAdded) {
            return res.status(400).json({ message: "Mechanic already added to this garage" });
        }

        // Add mechanic to garage
        garage.mechanics.push(mechanicId);
        await garage.save();

        // Reload garage with populated mechanics
        const updatedGarage = await Garage.findById(garage._id).populate("mechanics", "name email mobile");

        return res.json(updatedGarage);

    } catch (error) {
        return res.status(500).json({ message: "Server error while adding mechanic" });
    }
};

module.exports = {
    createGarage,
    listOwnedGarages,
    updateGarage,
    addMechanic
};