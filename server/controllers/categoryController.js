import Category from "../models/Category";
import Product from "../models/Product";
import cloudinary from "../config/cloudinary.js"


export const addCategory = async (req, res) => {

    try {

        console.log("add to catergory")
        console.log("body:", req.body)
        const { categoryName, image } = req.body
        console.log("categoryName:", categoryName)
        console.log("image:", image)
        if (!categoryName)
            return res.status(400).json({ success: false, message: "Category name required" })

        if (!image?.url || !image?.public_id)
            return res.status(400).json({ success: false, message: "Image object missing" })
        console.log("image.url:", image.url)
        console.log("image.punlic_id:", image.public_id)

        const categoryExists = await Category.findOne({ categoryName });
        if (categoryExists)
            return res.status(400).json({ success: false, message: "Category Already Exists" })

        const category = await Category.carete({
            categoryName,
            image: { url: image.url, public_id: image.public_id },

        });

        return res.status(201).json({ success: true, message: "Category added Successfully", category })

    } catch (error) {

    }

}