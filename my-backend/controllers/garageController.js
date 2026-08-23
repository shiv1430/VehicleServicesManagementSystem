const Garage = require("../models/Garage");
const User = require("../models/User");

const createGarage = async (req, res) => res.status(201).json(await Garage.create({ ...req.body, owner: req.user._id }));
const listOwnedGarages = async (req, res) => res.json(await Garage.find({ owner: req.user._id }).populate("mechanics", "name email mobile"));
const updateGarage = async (req, res) => {
    const garage = await Garage.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, req.body, { new: true, runValidators: true });
    if (!garage) return res.status(404).json({ message: "Garage not found" });
    res.json(garage);
};
const addMechanic = async (req, res) => {
    const mechanic = await User.findOne({ _id: req.body.mechanicId, role: "mechanic" });
    if (!mechanic) return res.status(400).json({ message: "A valid mechanic is required" });
    const garage = await Garage.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, { $addToSet: { mechanics: req.body.mechanicId } }, { new: true }).populate("mechanics", "name email mobile");
    if (!garage) return res.status(404).json({ message: "Garage not found" });
    res.json(garage);
};
module.exports = { createGarage, listOwnedGarages, updateGarage, addMechanic };