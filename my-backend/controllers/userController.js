const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// REGISTER USER
const registerUser = async (req, res) => {
    try {
        // Get data sent by the client
        const name = req.body.name;
        const email = req.body.email;
        const mobile = req.body.mobile;
        const password = req.body.password;
        const role = req.body.role || "customer";

        // Basic validation
        if (!name || !email || !mobile || !password) {
            return res.status(400).json({ message: "Name, email, mobile and password are required" });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters" });
        }

        // Check if the email is already used
        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // bcrypt is used to protect the password.
        // Instead of saving the real password, we save a hashed version.
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user object in MongoDB
        const newUser = new User({
            name: name,
            email: email,
            mobile: mobile,
            role: role,
            password: hashedPassword
        });

        await newUser.save();

        // Create a JWT after successful registration.
        // We put the user ID and role inside the token so the server can identify the user later.
        const token = jwt.sign(
            {
                userId: newUser._id.toString(),
                role: newUser.role
            },
            process.env.JWT_SECRET || "development-only-secret",
            { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );

        return res.status(201).json({
            message: "User registered successfully",
            token: token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                mobile: newUser.mobile,
                role: newUser.role
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "User already exists" });
        }

        return res.status(500).json({ message: "Server error while registering user" });
    }
};

// LOGIN USER
const loginUser = async (req, res) => {
    try {
        // Get email and password from the request
        const email = req.body.email;
        const password = req.body.password;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find the user by email in MongoDB
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // bcrypt.compare() checks if the password entered by the user matches the hashed password stored in the database.
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // JWT is created after successful login.
        // The token is used to prove the user is logged in in future requests.
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET || "development-only-secret",
            { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );

        return res.json({
            message: "Login successful",
            token: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role
            }
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error while logging in" });
    }
};

// GET ALL USERS
const getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");

        return res.json(users);
    } catch (error) {
        return res.status(500).json({ message: "Server error while getting users" });
    }
};

// UPDATE USER
const updateUser = async (req, res) => {
    try {
        // User can update their own account, or admin can update any account
        if (req.user.role !== "admin" && req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ message: "You cannot update this user" });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update only fields that are sent in the request
        if (req.body.name) {
            user.name = req.body.name;
        }

        if (req.body.email) {
            user.email = req.body.email;
        }

        if (req.body.mobile) {
            user.mobile = req.body.mobile;
        }

        if (req.body.role) {
            user.role = req.body.role;
        }

        if (req.body.password) {
            // If a new password is provided, hash it before saving
            user.password = await bcrypt.hash(req.body.password, 10);
        }

        await user.save();

        return res.json({
            message: "User updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role
            }
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error while updating user" });
    }
};

// DELETE USER
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await user.deleteOne();

        return res.json({ message: "User deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: "Server error while deleting user" });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUsers,
    updateUser,
    deleteUser
};