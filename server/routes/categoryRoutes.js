import express from "express";
import { addCategory, getCategories, getCategory } from "../controllers/categoryController.js"
import { authMiddlewere } from "../middleware/authmiddleware";