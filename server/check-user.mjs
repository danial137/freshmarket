
import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";

try {
    await mongoose.connect(process.env.MONGODB_URI);

    const user = await User.findOne({
        email: "danial79fakhrabadi@gmail.com",
    }).select("email isVerified verifyOtp verifyOtpExpire");

    if (!user) {
        console.log("User not found");
    } else {
        console.log({
            email: user.email,
            isVerified: user.isVerified,
            hasOtpHash: Boolean(user.verifyOtp),
            otpExpiresAt: user.verifyOtpExpire,
            isExpired:
                !user.verifyOtpExpire ||
                user.verifyOtpExpire.getTime() <= Date.now(),
        });
    }
} catch (error) {
    console.error("Check failed:", error.message);
} finally {
    await mongoose.disconnect();
}
