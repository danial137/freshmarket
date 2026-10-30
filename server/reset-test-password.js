
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "./models/User.js";

const email = "danial79fakhrabadi@gmail.com";
const newPassword = "FreshMarket_Test_2026!";

async function resetTestPassword() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing from .env");
        }

        await mongoose.connect(process.env.MONGODB_URI);

        const user = await User.findOne({ email });

        if (!user) {
            console.log("User not found.");
            return;
        }

        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();

        console.log("Test password updated successfully.");
        console.log("Email:", email);
        console.log("New password:", newPassword);
        console.log("Verified:", user.isVerified);
    } catch (error) {
        console.error("Password reset failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

resetTestPassword();
