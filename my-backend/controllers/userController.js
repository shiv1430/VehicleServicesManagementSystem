const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Garage = require("../models/Garage");
const GarageJoinRequest = require("../models/GarageJoinRequest");

// Helper to generate a cryptographically secure, unique garage reference code
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

// REGISTER USER
const registerUser = async (req, res) => {
    try {
        const name = req.body.name ? req.body.name.trim() : "";
        const email = req.body.email ? req.body.email.trim().toLowerCase() : "";
        const mobile = req.body.mobile ? req.body.mobile.trim() : "";
        const password = req.body.password;
        const requestedRole = req.body.role || "customer";

        // Basic validation
        if (!name || !email || !mobile || !password) {
            return res.status(400).json({ message: "Name, email, mobile and password are required" });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long" });
        }

        // Security: Whitelist allowed registration roles. Never allow registering as 'admin'.
        const allowedRoles = ["customer", "mechanic", "garage_owner"];
        if (!allowedRoles.includes(requestedRole)) {
            return res.status(400).json({ message: "Invalid role specified for registration" });
        }

        // Check if the email is already used
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // If registering as Mechanic, check if a garage reference code was provided
        let targetGarage = null;
        let sanitizedSkills = [];

        if (requestedRole === "mechanic") {
            const garageCode = (req.body.garageCode || req.body.referenceCode || "").trim().toUpperCase();
            if (garageCode) {
                targetGarage = await Garage.findOne({ referenceCode: garageCode });
                if (!targetGarage) {
                    return res.status(404).json({ message: "Invalid garage reference code. No garage found matching this code." });
                }
            }

            // Sanitize & validate skills
            if (Array.isArray(req.body.skills)) {
                sanitizedSkills = req.body.skills
                    .map(s => String(s).trim())
                    .filter(s => s.length > 0 && s.length <= 50);
            } else if (typeof req.body.skills === "string" && req.body.skills.trim()) {
                sanitizedSkills = req.body.skills
                    .split(",")
                    .map(s => s.trim())
                    .filter(s => s.length > 0 && s.length <= 50);
            }
            // Remove duplicates
            sanitizedSkills = [...new Set(sanitizedSkills)];
        }

        // If registering as Garage Owner with garage details, validate them
        const hasGarageDetails = requestedRole === "garage_owner" && (req.body.garageName || req.body.garageAddress);
        if (hasGarageDetails) {
            const garageName = req.body.garageName ? req.body.garageName.trim() : "";
            const garageAddress = req.body.garageAddress ? req.body.garageAddress.trim() : "";
            if (!garageName || !garageAddress) {
                return res.status(400).json({ message: "Garage Name and Garage Address are required for Garage Owner registration" });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            name,
            email,
            mobile,
            role: requestedRole,
            password: hashedPassword,
            skills: sanitizedSkills,
            membershipStatus: requestedRole === "mechanic" ? "pending" : (requestedRole === "garage_owner" ? "active" : "none")
        });

        await newUser.save();

        let createdGarage = null;

        // If Garage Owner supplied garage details, create their Garage atomically
        if (requestedRole === "garage_owner" && req.body.garageName && req.body.garageAddress) {
            const garageName = req.body.garageName.trim();
            const garageAddress = req.body.garageAddress.trim();
            const garagePhone = req.body.garagePhone ? req.body.garagePhone.trim() : mobile;
            const garageDescription = req.body.garageDescription ? req.body.garageDescription.trim() : "";
            const referenceCode = await generateUniqueGarageCode();

            const defaultServices = [
                { name: "General Service & Inspection", description: "Comprehensive vehicle health check", price: 1500, durationMinutes: 60 },
                { name: "Oil Change & Filter", description: "Engine oil replacement and filter change", price: 1200, durationMinutes: 45 },
                { name: "Brake Service & Pad Replacement", description: "Brake diagnostics, cleaning and pad replacement", price: 2200, durationMinutes: 90 },
                { name: "AC Maintenance & Gas Refill", description: "Air conditioning diagnostic and cooling gas top-up", price: 1800, durationMinutes: 60 }
            ];

            createdGarage = new Garage({
                owner: newUser._id,
                name: garageName,
                referenceCode,
                address: garageAddress,
                phone: garagePhone,
                description: garageDescription,
                services: req.body.services && req.body.services.length > 0 ? req.body.services : defaultServices,
                verified: true
            });

            await createdGarage.save();
            newUser.primaryGarage = createdGarage._id;
            await newUser.save();
        }

        // If Mechanic, link primaryGarage and create GarageJoinRequest in pending status
        if (requestedRole === "mechanic" && targetGarage) {
            newUser.primaryGarage = targetGarage._id;
            await newUser.save();

            await GarageJoinRequest.create({
                garage: targetGarage._id,
                mechanic: newUser._id,
                skills: sanitizedSkills,
                status: "pending"
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: newUser._id.toString(),
                role: newUser.role
            },
            process.env.JWT_SECRET || "development-only-secret",
            { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );

        return res.status(201).json({
            message: requestedRole === "mechanic"
                ? "Mechanic account created. Your request to join the garage is pending owner approval."
                : "User registered successfully",
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                mobile: newUser.mobile,
                role: newUser.role,
                skills: newUser.skills || [],
                membershipStatus: newUser.membershipStatus,
                primaryGarage: newUser.primaryGarage
            },
            garage: createdGarage ? {
                id: createdGarage._id,
                name: createdGarage.name,
                referenceCode: createdGarage.referenceCode,
                address: createdGarage.address,
                phone: createdGarage.phone
            } : undefined
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "User already exists" });
        }
        return res.status(500).json({ message: "Server error while registering user: " + error.message });
    }
};

// LOGIN USER
const loginUser = async (req, res) => {
    try {
        const email = req.body.email ? req.body.email.trim().toLowerCase() : "";
        const password = req.body.password;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email }).populate("primaryGarage", "name referenceCode address phone");

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

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
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                skills: user.skills || [],
                membershipStatus: user.membershipStatus || "none",
                primaryGarage: user.primaryGarage
            }
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error while logging in" });
    }
};

// GET ALL USERS (Admin Only)
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

        if (req.body.name) {
            user.name = req.body.name.trim();
        }

        if (req.body.email) {
            user.email = req.body.email.trim().toLowerCase();
        }

        if (req.body.mobile) {
            user.mobile = req.body.mobile.trim();
        }

        // Security: Non-admin users cannot alter their own role
        if (req.body.role) {
            if (req.user.role !== "admin") {
                return res.status(403).json({ message: "You are not authorized to change account role" });
            }
            user.role = req.body.role;
        }

        if (req.body.password) {
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
                role: user.role,
                skills: user.skills || [],
                membershipStatus: user.membershipStatus
            }
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error while updating user" });
    }
};

// GET MECHANIC PROFILE (Self)
const getMechanicProfile = async (req, res) => {
    try {
        if (req.user.role !== "mechanic") {
            return res.status(403).json({ message: "Only mechanics can access mechanic profile" });
        }

        const mechanic = await User.findById(req.user._id)
            .select("-password")
            .populate("primaryGarage", "name referenceCode address phone leadMechanic");

        // Check if there is a pending join request
        const joinRequest = await GarageJoinRequest.findOne({ mechanic: req.user._id })
            .populate("garage", "name referenceCode address")
            .sort({ createdAt: -1 });

        return res.json({
            user: mechanic,
            joinRequest: joinRequest ? {
                id: joinRequest._id,
                garage: joinRequest.garage,
                status: joinRequest.status,
                skills: joinRequest.skills,
                requestedAt: joinRequest.requestedAt
            } : null
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error while getting mechanic profile" });
    }
};

// UPDATE MECHANIC SKILLS (Self only)
const updateMechanicSkills = async (req, res) => {
    try {
        if (req.user.role !== "mechanic") {
            return res.status(403).json({ message: "Only mechanics can update skills" });
        }

        let newSkills = [];
        if (Array.isArray(req.body.skills)) {
            newSkills = req.body.skills;
        } else if (req.body.skill && typeof req.body.skill === "string") {
            newSkills = [...(req.user.skills || []), req.body.skill];
        } else {
            return res.status(400).json({ message: "Provide a skill or array of skills" });
        }

        // Sanitize and validate
        const sanitized = newSkills
            .map(s => String(s).trim())
            .filter(s => s.length > 0 && s.length <= 50);

        if (sanitized.length === 0) {
            return res.status(400).json({ message: "Skills cannot be empty" });
        }

        // Deduplicate skills (case-normalized check)
        const unique = [];
        const seen = new Set();
        for (const s of sanitized) {
            const lower = s.toLowerCase();
            if (!seen.has(lower)) {
                seen.add(lower);
                unique.push(s);
            }
        }

        const user = await User.findById(req.user._id);
        user.skills = unique;
        await user.save();

        return res.json({
            message: "Skills updated successfully",
            skills: user.skills
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error while updating mechanic skills" });
    }
};

// DELETE USER (Admin Only)
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
    deleteUser,
    getMechanicProfile,
    updateMechanicSkills
};