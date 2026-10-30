import multer from "multer"

import path from "path"

import fs from "fs"


const uploadDir = "upload"

const ensureUploadDirectory = () => {
    try {
        if (!fs.existsSync(uploadDir)) {
            fs.makedirSync(uploadDir, { recursive: true })
        }
    } catch (error) {

        console.error("upload directory error:", error.message)
        throw error

    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            ensureUploadDirectory
        } catch (error) {
            
        }
    }
})