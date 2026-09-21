const Vehicle = require("../models/Vehicle");

// Get all vehicles for the logged-in customer
const listVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ owner: req.user._id }).sort({ createdAt: -1 });
        return res.json(vehicles);
    } catch (error) {
        return res.status(500).json({ message: "Server error while getting vehicles" });
    }
};

// Add a new vehicle for the logged-in customer
const addVehicle = async (req, res) => {
    try {
        const owner = req.user._id;
        const vehicleNumber = req.body.vehicleNumber;
        const brand = req.body.brand;
        const model = req.body.model;
        const fuelType = req.body.fuelType;
        const manufacturingYear = req.body.manufacturingYear;

        if (!vehicleNumber || !brand || !model || !fuelType || !manufacturingYear) {
            return res.status(400).json({ message: "All vehicle fields are required" });
        }

        const newVehicle = new Vehicle({
            owner: owner,
            vehicleNumber: vehicleNumber,
            brand: brand,
            model: model,
            fuelType: fuelType,
            manufacturingYear: manufacturingYear
        });

        const savedVehicle = await newVehicle.save();

        return res.status(201).json(savedVehicle);

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "This vehicle number already exists" });
        }

        return res.status(500).json({ message: "Server error while creating vehicle" });
    }
};

// Update a vehicle owned by the logged-in customer
const updateVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user._id });

        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        if (req.body.vehicleNumber) {
            vehicle.vehicleNumber = req.body.vehicleNumber;
        }

        if (req.body.brand) {
            vehicle.brand = req.body.brand;
        }

        if (req.body.model) {
            vehicle.model = req.body.model;
        }

        if (req.body.fuelType) {
            vehicle.fuelType = req.body.fuelType;
        }

        if (req.body.manufacturingYear) {
            vehicle.manufacturingYear = req.body.manufacturingYear;
        }

        const updatedVehicle = await vehicle.save();

        return res.json(updatedVehicle);

    } catch (error) {
        return res.status(500).json({ message: "Server error while updating vehicle" });
    }
};

// Delete a vehicle owned by the logged-in customer
const deleteVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user._id });

        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        await vehicle.deleteOne();

        return res.json({ message: "Vehicle deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: "Server error while deleting vehicle" });
    }
};

module.exports = {
    listVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle
};