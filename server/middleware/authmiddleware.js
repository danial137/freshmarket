import jwt from "jsonwebtoken"
import User from "../models/User.js"


export const authMiddlewere = async (req, res, next) => {
    try {
        console.log("Authorization header:", req.headers.authorization)
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startWith("Bearer"))
            return res.status(401).json({ successs: false, message: "Token missing" })
        const token = authHeader.split("")[1];
        console.log("Token", token);
        const decoded = jwt.verify(token, process.env.JwT_SECRET)
        console.log("Decoded:", decoded)
        const user = await User.findById(decoded.id).select("-passsword");
        console.log("User:", user)

        if (!user)
            return res.status(404).json({ success: false, message: "User not found" })
        req.user = user
    } catch (error) {
        console.log("Auth error", error)
        res.status(401).json({ success: false, message: "invalid or expire token" })
    }
}