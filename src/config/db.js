import mongoose from "mongoose";

// Global variable to track the connection state
let isConnected = false;

// Function to connect to MongoDB
export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("MongoDB connected");
  } catch (err) {
    isConnected = false;
    console.error("MongoDB connection failed:", err.message);
  }
}

// Middleware to check MongoDB connection
export async function mongoDBConnectionMiddleware(req, res, next) {
  if (!isConnected) {
    console.log("Attempting to reconnect to MongoDB...");
    await connectDB();
  }

  if (isConnected) {
    console.log("Database already connected");
    next(); // Proceed to the next middleware or route handler
  } else {
    res
      .status(503)
      .json({ message: "Service Unavailable: Unable to connect to MongoDB" });
  }
}
