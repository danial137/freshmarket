import express from "express";
import { addCategory, deleteCategory, getCategories, getCategory, updateCategory } from "../controllers/categoryController.js"
import { authMiddlewere } from "../middleware/authmiddleware.js";


const router = express.Router()

router.post("/add", authMiddlewere, addCategory);
router.get("/", getCategories)
router.get("/:id", getCategory)
router.put("/:id", authMiddlewere, updateCategory)
router.delete("/:id",authMiddlewere,deleteCategory)