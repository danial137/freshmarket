import cloudinary from "../config/cloudinary.js"
import fs from "fs"


export const uploadImg = async (req, res) => {
    try {

        if (!req.file)
            return res.status(400).json({ success: false, message: "please select an image" })

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "FreshMarket-Images",
            resource_type: "image"

        });

        try {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path)
        } catch (cleanupError) {
            console.log("Local upload cleanup failed:", cleanupError.message)
        }

        res.status(200).json({ success: true, message: "Image upload successfully", image: { url: result.secure_url, public_id: result.public_id }, })

    } catch (error) {

        console.log(error);

        if (req.file?.path && fs.existsSync(req.file.path))

            fs.unlinkSync(req.file.path)

        res.status(500).json({ success: false, message: error.message })
    }
}