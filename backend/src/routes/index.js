import { Router } from "express";
import publicRoutes from "./api/public.js";
import privateRoutes from "./api/private.js";
import { sendResponse } from "../utils/responseHandler.js";
import { config } from "../config/config.js";

const router = Router();

router.get("/health", (req, res) => {
    sendResponse(res, {
        statusCode: 200,
        message: "Server is up and running.",
    });
});

router.use(`${config.apiPrefix}`, publicRoutes);
router.use(`${config.apiPrefix}`, privateRoutes);

export default router;
