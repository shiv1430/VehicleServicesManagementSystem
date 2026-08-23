const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role
});

const tokenFor = (user) => jwt.sign(
    { userId: user._id.toString(), role: user.role },
    process.env.JWT_SECRET || "development-only-secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
);

// REGISTER USER
const registerUser = async (req, res) => {
    try {
        const { name, email, mobile, password, role = "customer" } = req.body;

        if (!name || !email || !mobile || !password) {
            return res.status(400).json({ message: "Name, email, mobile and password are required" });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters" });
        }

        if (!["customer", "mechanic", "garage_owner"].includes(role)) {
            return res.status(400).json({ message: "Invalid registration role" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({ message: "Email is already registered" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new User({
            name,
            mobile,
            role,
            email,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({ message: "User registered successfully", user: publicUser(user), token: tokenFor(user) });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Email is already registered" });
        }
        res.status(500).json({ message: "Error registering user" });
    }
};


// LOGIN USER
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Compare entered password with hashed password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Create JWT token
        res.json({
            message: "Login successful",
            token: tokenFor(user),
            user: publicUser(user)
        });

    } catch (error) {
        res.status(500).json({ message: "Error logging in" });
    }
};


// GET ALL USERS
const getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error getting users" });
    }
};


// UPDATE USER
const updateUser = async (req, res) => {
    try {
        if (req.user.role !== "admin" && req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ message: "You cannot update this user" });
        }
        const updates = {};
        ["name", "email", "mobile", "role"].forEach((field) => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });
        if (req.body.password) updates.password = await bcrypt.hash(req.body.password, 10);
        const user = await User.findByIdAndUpdate(req.params.id, updates, { returnDocument: "after", runValidators: true }).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);

    } catch (error) {
        res.status(500).json({ message: "Error updating user" });
    }
};


// DELETE USER
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: "Error deleting user" });
    }
};


module.exports = {
    registerUser,
    loginUser,
    getUsers,
    updateUser,
    deleteUser
};