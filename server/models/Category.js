import mongoose from "mongoose"

const categorySchema = new mongoose.Schema(
    {
        categoryName: { type: string }
    }
)