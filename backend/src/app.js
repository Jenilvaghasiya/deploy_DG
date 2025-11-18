import express from "express";
import { corsMiddleware, errorHandler } from "./middlewares/index.js";
import router from "./routes/index.js";
import { startExpiryAndSubscriptionJob } from "./modules/gallery/service.js";
import { startTaskStatusPolling } from "./modules/image_variation/controller.js";
import { handleStripeWebhook } from "./modules/stripe/webhook.js";
import { startNotificationScheduler } from "./modules/strapi-admin/controller.js";

const app = express();

/**
 * Security Middleware Configuration
 */
app.use(corsMiddleware);
startNotificationScheduler();
startExpiryAndSubscriptionJob();
startTaskStatusPolling();

/**
 * Stripe Webhook Route
 */
app.post(
  "/api/v1/webhook",
  express.raw({ type: "application/json" }), // raw body parser
  handleStripeWebhook
);

/**
 * Request Parser Configuration
 */
app.use(
    express.json({
        limit: "10mb",
    }),
);
app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb",
    }),
);

/**
 * Static Files Configuration
 */
app.use(express.static("public"));
app.use("/api/v1/uploads", express.static("uploads"));

/**
 * Inject Socket.IO into request
 */
app.use((req, res, next) => {
    req.io = app.get("io");
    next();
});

/**
 * API Routes Configuration
 */
app.use("/", router);

app.get("/api/health", (req, res) => {
  res.json({ status: "success", message: "Backend is running" });
});

/**
 * 404 Handler
 */
app.get('/', (req, res) => {
  res.status(200).send(`
    <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 100px;">
      <h1 style="color: #4CAF50;">✅ Server is Running</h1>
      <p style="font-size: 18px; color: #555;">Your API is live and ready to accept requests.</p>
    </div>
  `);
});
app.use((req, res) => {
    res.status(404).json({
        status: "error",
        message: "Route not found",
    });
});

/**
 * Global Error Handler
 */
app.use(errorHandler);

export default app;
