import Product from "../models/Product.js"
import cloudinary from "../config/cloudinary.js"



export const addProduct = async (req, res) => {
    try {
        const { image, name, company, sellingPrice, oldPrice, size, category } = req.body

        if (!image?.url || !image?.public_id)
            return res.status(400).json({ success: false, message: "product image is required" })
        const product = await Product.create({
            image: { url: image.url, public_id: image.public_id },
            name,
            company,
            sellingPrice,
            oldPrice,
            size,
            category

        })

        res.status(201).json({ success: true, message: "Product created successfully", product })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

export const getProduct = async (req, res) => {
    try {

    } catch (error) {

    }
}