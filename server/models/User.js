import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        phone: {
            type: String,
            trim: true,
            default: null,
            match: /^09\d{9}$/,
        },

        password: {
            type: String,
            required: true,

        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },

        isVerified: {
            type: Boolean,
            default: false,


        },

        verifyOtp: {
            type: String,
            default: null,
        },

        verifyOtpExpire: {
            type: Date,
            default: null,
        },

        resetOtp: {
            type: String,
            default: null,

        },

        resetOtpExpire: {
            type: Date,
            default: null,
        },

    },
    {
        timestamps: true
    }
);


export default mongoose.model("User", userSchema)