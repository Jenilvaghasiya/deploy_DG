import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

/**
 * Generate a JWT token with user payload
 */
export const generateToken = (payload, { keepMeLoggedIn = false, ...options } = {}) => {
    try {
        return jwt.sign(payload, config.jwt.secret, {
            expiresIn: keepMeLoggedIn ? config.jwt.longExpiry : config.jwt.expiresIn,
            ...options,
        });
    } catch (err) {
        console.error("Error generating token:", err);
        throw new Error("Failed to generate token");
    }
};
