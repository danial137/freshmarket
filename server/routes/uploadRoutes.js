import express from "express"
import upload from "../middleware/upload.js"
import { uploadImg } from "../controllers/uploadController.js"


const router = express.Router()

router.post("/", upload.single("image"), uploadImg)

export default router