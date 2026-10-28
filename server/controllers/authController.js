
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/emailService.js";

const hashOtp = (otp) =>
    crypto.createHash("sha256").update(otp).digest("hex");

const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (char) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        };

        return entities[char];
    });

export const register = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // 1. Validate required fields
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required.",
            });
        }

        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (normalizedName.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Name must be at most 100 characters.",
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address.",
            });
        }

        if (normalizedEmail.length > 254) {
            return res.status(400).json({
                success: false,
                message: "Email address is too long.",
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
                    message: "Phone number must be a valid Iranian mobile number.",
                });
            }
        }

        // 2. Check whether email already exists
        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists.",
            });
        }

        // 3. Check phone only if provided
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

        // 4. Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        // 5. Generate a six-digit OTP
        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // 6. Create an unverified account
        const user = new User({
            name: normalizedName,
            email: normalizedEmail,
            ...(normalizedPhone ? { phone: normalizedPhone } : {}),
            password: hashedPassword,
            isVerified: false,
            verifyOtp: hashOtp(otp),
            verifyOtpExpire: otpExpiresAt,
        });

        await user.save();

        // 7. Send the verification email
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
                    "Your account was created but the verification email could not be sent. Please request a new code.",
            });
        }

        // 8. Respond without returning the password or OTP
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



export const verifyEmailOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (
            typeof email !== "string" ||
            typeof otp !== "string" ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
            !/^\d{6}$/.test(otp)
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email and six-digit OTP.",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

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
            user.verifyOtpExpire.getTime() <= Date.now()
        ) {
            return res.status(400).json({
                success: false,
                message: "Verification code has expired. Request a new code.",
            });
        }

        const submittedHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest();

        const storedHash = Buffer.from(user.verifyOtp, "hex");

        if (
            storedHash.length !== submittedHash.length ||
            !crypto.timingSafeEqual(storedHash, submittedHash)
        ) {
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



export const resendEmailOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (
            typeof email !== "string" ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address.",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail,
        });

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

        const otp = crypto.randomInt(100000, 1000000).toString();

        user.verifyOtp = hashOtp(otp);
        user.verifyOtpExpire = new Date(Date.now() + 10 * 60 * 1000);

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
            <p>This code expires in 10 minutes. Your previous code is no longer valid.</p>
          </div>
        `,
            });
        } catch (emailError) {
            console.error("Resend OTP email failed:", emailError.message);

            // Invalidate the code that was not successfully sent.
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


export const login = async (req, res) => {
    try {
        const { email, password } = req.body ?? {};

        // Check required fields
        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }

        // Find user by email
        const user = await User.findOne({
            email: email.trim().toLowerCase(),
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        // Compare password with hashed password
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        // Require email verification
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email first.",
            });
        }

        // Check JWT secret
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured.");
        }

        // Generate JWT
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

