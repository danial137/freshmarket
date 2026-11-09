import mongoose from "mongoose"

const categorySchema = new mongoose.Schema(
    {
        categoryName: { type: String, required: true, unique: true, trim: true },
        image: {
            url: { type: String, required: true },
            public_id: { type: String, required: true }
        },

    },

    { timestamps: true }
)

export default mongoose.model("Category", categorySchema)