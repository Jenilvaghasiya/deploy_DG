import mongoose from "mongoose";
import { config } from "./config.js";

const connectMongoDB = async () => {
    try {
        await mongoose.connect(config.mongo.uri);

        console.log("MongoDB connected");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }
};

export default connectMongoDB;
