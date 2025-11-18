import { ApiError } from "../utils/ApiError.js";
import { sendResponse } from "../utils/responseHandler.js";
import mongoose from "mongoose";

export const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = "Internal Server Error";
    let errors = null;

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
    }

    // if err is string set the message
    if(typeof err === "string"){
        message = err;
    }

    // Mongoose ValidationError (e.g., required field missing)
    else if (err instanceof mongoose.Error.ValidationError) {
        statusCode = 400;
        message = "Validation Error";
        errors = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
    }

    // Mongoose CastError (invalid ObjectId, etc.)
    else if (err instanceof mongoose.Error.CastError) {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    // Log the full error for debugging
    console.error(err);

    return sendResponse(res, {
        statusCode,
        status: "error",
        message,
        data: errors,
    });
};
