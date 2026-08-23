const Vehicle = require("../models/Vehicle");

const listVehicles = async (req, res) => res.json(await Vehicle.find({ owner: req.user._id }).sort({ createdAt: -1 }));
const addVehicle = async (req, res) => {
    try { res.status(201).json(await Vehicle.create({ ...req.body, owner: req.user._id })); }
    catch (error) { res.status(error.code === 11000 ? 409 : 400).json({ message: error.code === 11000 ? "Vehicle number already exists" : error.message }); }
};
const updateVehicle = async (req, res) => {
    const vehicle = await Vehicle.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, req.body, { new: true, runValidators: true });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json(vehicle);
};
const deleteVehicle = async (req, res) => {
    const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json({ message: "Vehicle deleted" });
};
module.exports = { listVehicles, addVehicle, updateVehicle, deleteVehicle };