
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";

import User from "../models/User.js";
import { sendEmail } from "../utils/emailService.js";
import { generateOtp, hashOtp } from "../utils/otp.js";

// -------------------- Helpers --------------------

const normalizeEmail = (email) => {
    if (typeof email !== "string") return null;

    const normalized = email.trim().toLowerCase();

    if (
        normalized.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
    ) {
        return null;
    }

    return normalized;
};

const escapeHtml = (value) => {
    const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    };

    return String(value).replace(/[&<>"']/g, (char) => entities[char]);
};

const isValidOtp = (otp, storedHash) => {
    if (
        typeof otp !== "string" ||
        !/^\d{6}$/.test(otp) ||
        typeof storedHash !== "string" ||
        !/^[a-f0-9]{64}$/i.test(storedHash)
    ) {
        return false;
    }

    const submittedHash = Buffer.from(hashOtp(otp), "hex");
    const savedHash = Buffer.from(storedHash, "hex");

    return (
        submittedHash.length === savedHash.length &&
        crypto.timingSafeEqual(submittedHash, savedHash)
    );
};

const OTP_EXPIRATION = 10 * 60 * 1000;

// -------------------- Register --------------------

export const register = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body ?? {};

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof password !== "string" ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required.",
            });
        }

        const normalizedName = name.trim();
        const normalizedEmail = normalizeEmail(email);

        if (!normalizedEmail) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address.",
            });
        }

        if (normalizedName.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Name must be at most 100 characters.",
            });
        }

        if (password.length < 8 || password.length > 72) {
            return res.status(400).json({
                success: false,
                message: "Password must be between 8 and 72 characters.",
            });
        }

        let normalizedPhone;

        if (phone !== undefined && phone !== null && phone !== "") {
            if (typeof phone !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Phone number must be a string.",
                });
            }

            normalizedPhone = phone.trim();

            if (!/^09\d{9}$/.test(normalizedPhone)) {
                return res.status(400).json({
                    success: false,
                    message: "Please enter a valid Iranian mobile number.",
                });
            }
        }

        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists.",
            });
        }

        if (normalizedPhone) {
            const existingPhone = await User.findOne({
                phone: normalizedPhone,
            });

            if (existingPhone) {
                return res.status(409).json({
                    success: false,
                    message: "This phone number is already registered.",
                });
            }
        }

        const otp = generateOtp();

        const user = new User({
            name: normalizedName,
            email: normalizedEmail,
            ...(normalizedPhone ? { phone: normalizedPhone } : {}),
            password: await bcrypt.hash(password, 12),
            isVerified: false,
            verifyOtp: hashOtp(otp),
            verifyOtpExpire: new Date(Date.now() + OTP_EXPIRATION),
        });

        await user.save();

        try {
            await sendEmail({
                to: normalizedEmail,
                subject: "Verify your FreshMarket account",
                html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto">
            <h2>Welcome to FreshMarket, ${escapeHtml(normalizedName)}!</h2>
            <p>Use the code below to verify your email address:</p>
            <div style="font-size:32px;font-weight:bold;letter-spacing:8px">
              ${otp}
            </div>
            <p>This code expires in 10 minutes.</p>
            <p>If you did not request this, you can ignore this email.</p>
          </div>
        `,
            });
        } catch (emailError) {
            console.error("Verification email failed:", emailError.message);

            return res.status(503).json({
                success: false,
                message:
                    "Your account was created, but the verification email could not be sent. Please request a new code.",
            });
        }

        return res.status(201).json({
            success: true,
            message: "Account created. Check your email for the verification code.",
            email: normalizedEmail,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account with these details already exists.",
            });
        }

        console.error("Registration failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Registration failed. Please try again.",
        });
    }
};

// -------------------- Verify Email --------------------

export const verifyEmailOtp = async (req, res) => {
    try {
        const { email, otp } = req.body ?? {};
        const normalizedEmail = normalizeEmail(email);

        if (!normalizedEmail || typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email and six-digit OTP.",
            });
        }

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or verification code.",
            });
        }

        if (user.isVerified) {
            return res.status(200).json({
                success: true,
                message: "Email is already verified.",
            });
        }

        if (
            !user.verifyOtp ||
            !user.verifyOtpExpire ||
            new Date(user.verifyOtpExpire).getTime() <= Date.now()
        ) {
            return res.status(400).json({
                success: false,
                message: "Verification code has expired. Request a new code.",
            });
        }

        if (!isValidOtp(otp, user.verifyOtp)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or verification code.",
            });
        }

        user.isVerified = true;
        user.verifyOtp = null;
        user.verifyOtpExpire = null;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Email verified successfully. Your account is now active.",
        });
    } catch (error) {
        console.error("Email verification failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Could not verify email. Please try again.",
        });
    }
};

// -------------------- Resend Verification OTP --------------------

export const resendEmailOtp = async (req, res) => {
    try {
        const normalizedEmail = normalizeEmail(req.body?.email);

        if (!normalizedEmail) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address.",
            });
        }

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Unable to process this request.",
            });
        }

        if (user.isVerified) {
            return res.status(200).json({
                success: true,
                message: "Email is already verified.",
            });
        }

        const otp = generateOtp();

        user.verifyOtp = hashOtp(otp);
        user.verifyOtpExpire = new Date(Date.now() + OTP_EXPIRATION);

        await user.save();

        try {
            await sendEmail({
                to: user.email,
                subject: "Your new FreshMarket verification code",
                html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto">
            <h2>FreshMarket email verification</h2>
            <p>Your new verification code is:</p>
            <div style="font-size:32px;font-weight:bold;letter-spacing:8px">
              ${otp}
            </div>
            <p>This code expires in 10 minutes.</p>
            <p>Your previous code is no longer valid.</p>
          </div>
        `,
            });
        } catch (emailError) {
            console.error("Resend OTP email failed:", emailError.message);

            user.verifyOtp = null;
            user.verifyOtpExpire = null;
            await user.save();

            return res.status(503).json({
                success: false,
                message: "Could not send a new code. Please try again later.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "A new verification code has been sent to your email.",
        });
    } catch (error) {
        console.error("Resend OTP failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Could not resend verification code.",
        });
    }
};

// -------------------- Login --------------------

export const login = async (req, res) => {
    try {
        const { email, password } = req.body ?? {};
        const normalizedEmail = normalizeEmail(email);

        if (!normalizedEmail || typeof password !== "string" || !password) {
            return res.status(400).json({
                success: false,
                message: "A valid email and password are required.",
            });
        }

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email first.",
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured.");
        }

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d",
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred.",
        });
    }
};

// -------------------- Forgot Password --------------------

export const forgotPassword = async (req, res) => {
    try {
        const normalizedEmail = normalizeEmail(req.body?.email);

        if (!normalizedEmail) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address.",
            });
        }

        const user = await User.findOne({ email: normalizedEmail });

        // Do not reveal whether an account exists.
        if (!user) {
            return res.status(200).json({
                success: true,
                message:
                    "If an account exists with this email, a password reset code will be sent.",
            });
        }

        const otp = generateOtp();

        user.resetOtp = hashOtp(otp);
        user.resetOtpExpire = new Date(Date.now() + OTP_EXPIRATION);

        await user.save();

        try {
            await sendEmail({
                to: user.email,
                subject: "FreshMarket - Password Reset",
                html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto">
            <h2>Reset your FreshMarket password</h2>
            <p>Hello ${escapeHtml(user.name)},</p>
            <p>Your password reset code is:</p>
            <div style="font-size:32px;font-weight:bold;letter-spacing:8px">
              ${otp}
            </div>
            <p>This code expires in 10 minutes.</p>
            <p>If you did not request this, you can ignore this email.</p>
          </div>
        `,
            });
        } catch (emailError) {
            console.error("Password reset email failed:", emailError.message);

            user.resetOtp = null;
            user.resetOtpExpire = null;
            await user.save();

            return res.status(503).json({
                success: false,
                message: "Unable to send reset email. Please try again later.",
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "If an account exists with this email, a password reset code will be sent.",
        });
    } catch (error) {
        console.error("Forgot password failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

// -------------------- Reset Password --------------------

export const resetPassword = async (req, res) => {
    try {
        const normalizedEmail = normalizeEmail(req.body?.email);
        const { otp, password } = req.body ?? {};

        if (
            !normalizedEmail ||
            typeof otp !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Email, OTP and password are required.",
            });
        }

        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: "OTP must be a six-digit code.",
            });
        }

        if (password.length < 8 || password.length > 72) {
            return res.status(400).json({
                success: false,
                message: "Password must be between 8 and 72 characters.",
            });
        }

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or OTP.",
            });
        }

        if (
            !user.resetOtp ||
            !user.resetOtpExpire ||
            new Date(user.resetOtpExpire).getTime() <= Date.now()
        ) {
            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request a new OTP.",
            });
        }

        if (!isValidOtp(otp, user.resetOtp)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or OTP.",
            });
        }

        user.password = await bcrypt.hash(password, 12);
        user.resetOtp = null;
        user.resetOtpExpire = null;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successful.",
        });
    } catch (error) {
        console.error("Reset password failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

// -------------------- Get Profile --------------------

export const getProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        return res.status(200).json({
            success: true,
            user: req.user,
        });
    } catch (error) {
        console.error("Get profile failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};
