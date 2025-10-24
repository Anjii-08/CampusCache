import mongoose from "mongoose";

const connectDB = async ()=>{
    try {
        mongoose.connection.on('connected',()=>{console.log("Database Connected")});
        await mongoose.connect('mongodb://127.0.0.1:27017/campuscache');
    } catch (error) {
        console.error("MongoDB Connection Error:", error);
        // If database doesn't exist, it will be created automatically
    }
} 

export default connectDB;