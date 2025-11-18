import mongoose from "mongoose";
import { config } from "../src/config/config.js";

export const connectTestDB = async () => {
    await mongoose.connect(config.mongo.uri);
};

export const disconnectTestDB = async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
};
