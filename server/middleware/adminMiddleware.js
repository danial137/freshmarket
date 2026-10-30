export const adminMiddleware = (req, res, next) => {
    try {

        if (req.user.role !== "admin") {
            return
        }
        
    } catch (error) {
        
    }
    
}