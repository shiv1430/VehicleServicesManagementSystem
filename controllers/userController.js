const User = require("../models/User");

// CREATE USER
const createUser = async (req, res) => {
    try {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        });

        await user.save();

        res.send("User saved successfully");
    } catch (error) {
        res.status(500).send("Error saving user");
    }
};


// GET ALL USERS
const getUsers = async (req, res) => {
    try {
        const users = await User.find();

        res.json(users);
    } catch (error) {
        res.status(500).send("Error getting users");
    }
};


// UPDATE USER
const updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                email: req.body.email,
                password: req.body.password
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).send("User not found");
        }

        res.json(user);
    } catch (error) {
        res.status(500).send("Error updating user");
    }
};


// DELETE USER
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).send("User not found");
        }

        res.send("User deleted successfully");
    } catch (error) {
        res.status(500).send("Error deleting user");
    }
};


module.exports = {
    createUser,
    getUsers,
    updateUser,
    deleteUser
};