
import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
    register,
    verifyEmailOtp,
    resendEmailOtp,
    login
} from "../controllers/authController.js";

const router = Router();

const createRateLimiter = (limit, message) =>
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        message: {
            success: false,
            message,
        },
    });

// Register: maximum 5 requests per 15 minutes.
const registerLimiter = createRateLimiter(
    5,
    "Too many registration attempts. Please try again later."
);

// Verify email: maximum 10 requests per 15 minutes.
const verifyOtpLimiter = createRateLimiter(
    10,
    "Too many verification attempts. Please try again later."
);

// Resend OTP: maximum 3 requests per 15 minutes.
const resendOtpLimiter = createRateLimiter(
    3,
    "Too many requests. Please try again later."
);

router.post("/register", registerLimiter, register);
router.post("/verify-email", verifyOtpLimiter, verifyEmailOtp);
router.post("/resend-otp", resendOtpLimiter, resendEmailOtp);
router.post("/login", login);

export default router;
