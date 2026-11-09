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
            return res.status(400).json({success:false})

    } catch (error) {

    }

}