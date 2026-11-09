import mongoose from "mongoose";


const productSchema = new mongoose.Schema(
    {
        image: {
            url: { type: String, required: true },
            public_id: { type: String, required: true }
        },
        name: { type: String, required: true, trim: true },
        company: { type: String, required: true, trim: true },
        sellingPrice: { type: Number, required: true },
        oldPrice: { type: Number, required: true },
        size: { type: String, required: true },
        category: { type: String, required: true }
    },
    { timestamps: true }
)

export default mongoose.model("Product", productSchema)