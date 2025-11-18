import app from "./app.js";
import connectMongoDB from "./config/database.js";
import mongoose from "mongoose";
import { config } from "./config/config.js";
import { Server as SocketIOServer } from "socket.io";
import { setupSocket } from "./sockets/index.js";
import http from "http";
import "./modules/gallery/service.js"; // <-- This line is REQUIRED
let server;
let io;

const startServer = async () => {
    try {
        await connectMongoDB();
        // await seedAll();

        const port = parseInt(config.port) || 3000;

        const httpServer = http.createServer(app);

        io = new SocketIOServer(httpServer, {
            cors: {
                origin: config.cors.origin,
                methods: config.cors.methods,
                credentials: config.cors.credentials,
            },
        });

        global.io = io;

        setupSocket(io);

        app.set("io", io);

        server = httpServer.listen(port, () => {
            console.log(`Server (HTTP + WebSocket) running on port ${port}`);
        });
    } catch (error) {
        console.error("Unable to start server:", error);
        process.exit(1);
    }
};

startServer();

/**
 * Graceful Shutdown
 */
const gracefulShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
    try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed.");
        if (server) {
            server.close(() => {
                console.log("Server shut down gracefully.");
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    } catch (err) {
        console.error("Error during shutdown:", err);
        process.exit(1);
    }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
