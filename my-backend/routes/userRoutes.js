// const express = require("express");
// const router = express.Router();

// const User = require("../models/User");

// router.post("/", async (req, res) => {
//     try {
//         const user = new User({
//             name: req.body.name,
//             email: req.body.email,
//             password: req.body.password
//         });

//         await user.save();

//         res.send("User saved successfully");
//     } catch (error) {
//         res.status(500).send("Error saving user");
//     }
// });

// router.get("/", async (req, res) => {
//     try {
//         const users = await User.find();

//         res.json(users);
//     } catch (error) {
//         res.status(500).send("Error getting users");
//     }
// });

// router.put("/:id", async (req, res) => {
//     try {
//         const user = await User.findByIdAndUpdate(
//             req.params.id,
//             {
//                 name: req.body.name,
//                 email: req.body.email,
//                 password: req.body.password
//             },
//             { new: true }
//         );

//         res.json(user);
//     } catch (error) {
//         res.status(500).send("Error updating user");
//     }
// });

// router.delete("/:id", async (req, res) => {
//     try {
//         const user = await User.findByIdAndDelete(req.params.id);

//         if (!user) {
//             return res.status(404).send("User not found");
//         }

//         res.send("User deleted successfully");
//     } catch (error) {
//         res.status(500).send("Error deleting user");
//     }
// });

// module.exports = router;

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

// REGISTER
router.post("/register", registerUser);

// LOGIN
router.post("/login", loginUser);

// GET ALL USERS
router.get("/", requireAuth, allowRoles("admin"), getUsers);

// UPDATE
router.put("/:id", requireAuth, updateUser);

// DELETE
router.delete("/:id", requireAuth, allowRoles("admin"), deleteUser);

module.exports = router;