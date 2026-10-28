
import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./config/db.js";
import { sendEmail } from "./utils/emailService.js";

const PORT = process.env.PORT || 5000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database
connectDB();

// Routes
app.get("/", (req, res) => {
    res.send("API working");
});

// Temporary email test route
app.post("/test-email", async (req, res) => {
    try {
        const result = await sendEmail({
            to: process.env.TEST_EMAIL,
            subject: "FreshMarket email test",
            html: "<h1>FreshMarket</h1><p>Email service is connected!</p>",
        });

        res.status(200).json({
            success: true,
            message: "Email request successful",
            id: result.id,
        });
    } catch (error) {
        console.error("Test email failed:", error);

        res.status(500).json({
            success: false,
            message: "Could not send test email",
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
