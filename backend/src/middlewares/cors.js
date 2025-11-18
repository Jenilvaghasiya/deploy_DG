import cors from "cors";
import { config } from "../config/config.js";

const corsOptions = {
    origin: config.cors.origin,
    methods: config.cors.methods,
    credentials: config.cors.credentials,
    maxAge: config.cors.maxAge,
};

export const corsMiddleware = cors(corsOptions);
