const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to check if user is authenticated
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;

        if (!token) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // Verify and decode the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "development-only-secret");

        // Get user from database
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // Save user info on request object
        req.user = user;
        next();

    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

// Middleware to check if user has the required role
const allowRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "You are not authorized" });
        }
        next();
    };
};

module.exports = { requireAuth, allowRoles };