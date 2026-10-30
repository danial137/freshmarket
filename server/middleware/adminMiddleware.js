export const adminMiddleware = (req, res) => {
    try {

        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied admin only"
            })
        }

    } catch (error) {
        res.status(500), json({
            success: false,
            message: error.message
        })

    }

}