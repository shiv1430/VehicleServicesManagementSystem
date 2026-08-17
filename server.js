// const express = require("express");
// const connectDB = require("./config/db");
// const User = require("./models/User");
// const userRoutes = require("./routes/userRoutes");

// app.use("/users", userRoutes);
// const app = express();

// connectDB();

// app.use(express.json());

// //write

// app.post("/users", async (req, res) => {
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

// //read

// app.get("/", (req, res) => {
//     res.send("Vehicle Management Backend is working!");
// });

// app.listen(3000, () => {
//     console.log("Server started on port 3000");
    
// });
// app.get("/users", async (req, res) => {
//     try {
//         const users = await User.find();

//         res.json(users);
//     } catch (error) {
//         res.status(500).send("Error getting users");
//     }
// });

// // update
// app.put("/users/:id", async (req, res) => {
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

// //delete

// app.delete("/users/:id", async (req, res) => {
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

const express = require("express");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(express.json());

connectDB();

app.use("/users", userRoutes);

app.get("/", (req, res) => {
    res.send("Vehicle Management Backend is working!");
});

app.listen(3000, () => {
    console.log("Server started on port 3000");
});