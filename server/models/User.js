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
            lowercase: type,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            unique: true,
            match: /^[0-9]{10}$/,

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
            
        }
    }
)