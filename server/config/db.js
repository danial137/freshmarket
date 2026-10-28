import mongoose from "mongoose";

export const connectDB = async  () => {
    await mongoose.connect("mongodb+srv://danial79fakhrabadi_db_user:p57HP9xEzkNgTVKH@cluster0.h6ctyah.mongodb.net/freshmarket").then(() => {
        console.log("DB IS CONNECTED")
    })
}