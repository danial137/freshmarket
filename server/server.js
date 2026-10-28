
import "dotenv/config";

import express from "express";
import cors from "cors";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

const PORT = process.env.PORT || 5000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
    res.status(200).send("FreshMarket API is working");
});

app.use("/api/auth", authRoutes);

// Start server after connecting to the database
const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`FreshMarket API is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();
