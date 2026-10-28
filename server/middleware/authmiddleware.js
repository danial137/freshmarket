import jwt from "jsonwebtoken"
import User from "../models/User"


export const authMiddlewere = async (req, res, next) => {
    try {
        console.log("Authorization header:", req.headers.authorization)
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startWith("Bearer"))
            return res.status(401).json({ successs: false, message: "Token missing" })
        const token = authHeader.split("")[1];
        console.log("Token", token)
    } catch (error) {

    }
}