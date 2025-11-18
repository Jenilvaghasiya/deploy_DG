import jwt from "jsonwebtoken";
import { asyncHandler } from "./asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";
import { config } from "../config/config.js";

/**
 * Verifies the JWT token from the request headers
 * Adds the decoded user data to the request object
 */
export const verifyToken = asyncHandler((req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return sendResponse(res, {
                statusCode: 401,
                message: "No token provided or invalid token format",
            });
        }

        const token = authHeader.split(" ")[1];

        jwt.verify(token, config.jwt.secret, (err, decoded) => {
            if (err) {
                if (err.name === "TokenExpiredError") {
                    return sendResponse(res, {
                        statusCode: 401,
                        message: "Token has expired",
                    });
                }

                return sendResponse(res, {
                    statusCode: 403,
                    message: "Invalid token",
                });
            }

            req.user = decoded;
            next();
        });
    } catch (error) {
        return sendResponse(res, {
            statusCode: 500,
            message: "Error verifying token",
        });
    }
});
