require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const userRoutes = require("./routes/userRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const platformRoutes = require("./routes/platformRoutes");
const garageRoutes = require("./routes/garageRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/users", userRoutes);
app.use("/vehicles", vehicleRoutes);
app.use("/bookings", bookingRoutes);
app.use("/api", platformRoutes);
app.use("/garages", garageRoutes);
app.use("/tasks", taskRoutes);

// Simple test route
app.get("/", (req, res) => {
    res.json({ message: "Smart Vehicle Service Platform", status: "ok" });
});

// Start server
const startServer = async () => {
    await connectDB();
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Server running on port ${port}`));
};

if (require.main === module) {
    startServer().catch(() => process.exit(1));
}

module.exports = app;