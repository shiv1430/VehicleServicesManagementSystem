const express = require("express");
const router = express.Router();
const { requireAuth, allowRoles } = require("../middleware/auth");

const {
    registerUser,
    loginUser,
    getUsers,
    updateUser,
    deleteUser
} = require("../controllers/userController");

// Register a new user
router.post("/register", registerUser);

// Login a user
router.post("/login", loginUser);

// Get all users only for admin
router.get("/", requireAuth, allowRoles("admin"), getUsers);

// Update a user account
router.put("/:id", requireAuth, updateUser);

// Delete a user only for admin
router.delete("/:id", requireAuth, allowRoles("admin"), deleteUser);

module.exports = router;