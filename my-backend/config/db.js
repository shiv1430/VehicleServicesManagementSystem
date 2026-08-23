const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vehicleManagement");
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection failed", error.message);
        throw error;
    }
};

module.exports = connectDB;