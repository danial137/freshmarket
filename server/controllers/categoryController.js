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
        console.log("CATEGORY ERROR:")
        console.log(error);
        return res.status(500).json({ success: false, message: error.message, stack: error.stack })
    }

};

export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res
            .status(200)
            .json({ success: true, count: categories.length, categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category)
            return res
                .status(404)
                .json({ success: false, message: "Category Not Found" });
        res.status(200).json({ success: true, category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category)
            return res
                .status(404)
                .json({ success: false, message: "Category Not Found" });
        const { categoryName, image } = req.body;
        const prevName = category.categoryName;
        let oldImagePublicId = null;
        if (categoryName) category.categoryName = categoryName;
        if (
            image?.url &&
            image?.public_id &&
            image.public_id !== category.image.public_id
        ) {
            oldImagePublicId = category.image.public_id;
            category.image = { url: image.url, public_id: image.public_id };
        }
        await category.save();
        if (categoryName && categoryName !== prevName) {
            await Product.updateMany(
                { category: prevName },
                { $set: { category: categoryName } },
            );
        }
        if (oldImagePublicId) {
            try {
                await cloudinary.uploader.destroy(oldImagePublicId);
            } catch (cleanupError) {
                console.log("Old category image cleanup failed:", cleanupError.message);
            }
        }
        res
            .status(200)
            .json({
                success: true,
                message: "Category Updated Successfully",
                category,
            });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category)
            return res
                .status(404)
                .json({ success: false, message: "Category Not Found" });
        if (category.image?.public_id)
            await cloudinary.uploader.destroy(category.image.public_id);
        await Category.findByIdAndDelete(req.params.id);
        res
            .status(200)
            .json({ success: true, message: "Category Deleted Successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};