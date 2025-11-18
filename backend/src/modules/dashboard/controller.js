import * as dashboardService from "./service.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendResponse } from "../../utils/responseHandler.js";
import mongoose from "mongoose";
import moment from "moment-timezone";


// Helper function to apply user access control
const applyUserFilter = (query, isUserAdmin, userID, requestedUsers) => {
    if (isUserAdmin) {
        // Admin can filter by requested users or see all
        if (requestedUsers && requestedUsers !== "all") {
            query.user_id = { $in: requestedUsers.split(",") };
        }
    } else {
        // Non-admin can only see their own data
        query.user_id = userID;
    }
    return query;
};

// Helper function to parse and map type values
const parseTypeFilter = (typeString) => {
    if (!typeString || typeString === 'all') {
        return null;
    }
    
    // Split by comma and trim whitespace
    const types = typeString.split(',').map(t => t.trim()).filter(t => t);
    
    // Map image_variation to ge_variation
    const mappedTypes = types.map(type => 
        type === 'image_variation' ? 'ge_variation' : type
    );
    
    return mappedTypes;
};

export const getTimeOnPlatform = asyncHandler(async (req, res) => {
    const isUserAdmin = req?.user?.is_admin;
    const userID = req?.user?.id;
    const { users, startDate, endDate, startTime, endTime } = req.query;

    const newQuery = {};
    applyUserFilter(newQuery, isUserAdmin, userID, users);

    let startDateTime, endDateTime;
    if (startDate && endDate) {
        // Full timestamp used for accurate session filtering (IST)
        startDateTime = moment.tz(
            `${startDate} ${startTime || "00:00:00"}`,
            "YYYY-MM-DD HH:mm:ss",
            "Asia/Kolkata"
        ).toDate();

        endDateTime = moment.tz(
            `${endDate} ${endTime || "23:59:59"}`,
            "YYYY-MM-DD HH:mm:ss",
            "Asia/Kolkata"
        ).toDate();

        // Date-only range for querying UserTime (IST)
        const startDateOnly = moment.tz(startDate, "YYYY-MM-DD", "Asia/Kolkata")
            .startOf("day")
            .toDate();

        const endDateOnly = moment.tz(endDate, "YYYY-MM-DD", "Asia/Kolkata")
            .endOf("day")
            .toDate();

        newQuery.date = {
            $gte: startDateOnly,
            $lte: endDateOnly
        };
    }

    const newData = await dashboardService.getTimeOnPlatformNew(
        newQuery,
        req.user.tenant_id,
        startDateTime,
        endDateTime
    );

    sendResponse(res, { data: newData });
});




export const getUsageTime = asyncHandler(async (req, res) => {
    const isUserAdmin = req?.user?.is_admin;
    const userID = req?.user?.id;
    const { users, type, startDate, endDate, startTime, endTime } = req.query;

    const newQuery = {};
    
    // Filter by module type - now supports multiple types
    const parsedTypes = parseTypeFilter(type);
    if (parsedTypes) {
        if (parsedTypes.length === 1) {
            newQuery.module = parsedTypes[0];
        } else {
            newQuery.module = { $in: parsedTypes };
        }
    }

    // Apply user filter based on admin status
    if (isUserAdmin) {
        if (users && users !== "all") {
            newQuery.user_id = {
                $in: users.split(",").map((id) => new mongoose.Types.ObjectId(id)),
            };
        }
    } else {
        newQuery.user_id = new mongoose.Types.ObjectId(userID);
    }

    let startDateTime, endDateTime;
    if (startDate && endDate) {
        // Full timestamp used for accurate session filtering (IST)
        startDateTime = moment.tz(
            `${startDate} ${startTime || "00:00:00"}`,
            "YYYY-MM-DD HH:mm:ss",
            "Asia/Kolkata"
        ).toDate();

        endDateTime = moment.tz(
            `${endDate} ${endTime || "23:59:59"}`,
            "YYYY-MM-DD HH:mm:ss",
            "Asia/Kolkata"
        ).toDate();

        // Date-only range for fetching UserModuleUsage documents (IST)
        const startDateOnly = moment.tz(startDate, "YYYY-MM-DD", "Asia/Kolkata")
            .startOf("day")
            .toDate();

        const endDateOnly = moment.tz(endDate, "YYYY-MM-DD", "Asia/Kolkata")
            .endOf("day")
            .toDate();

        newQuery.date = {
            $gte: startDateOnly,
            $lte: endDateOnly
        };
    }

    const newData = await dashboardService.getModuleUsageTimeNew(
        newQuery,
        req.user.tenant_id,
        startDateTime,
        endDateTime
    );

    const modifiedNewData = [{ subCategories: newData }];
    
    sendResponse(res, { data: modifiedNewData });
});



export const getOutputStats = asyncHandler(async (req, res) => {
    const isUserAdmin = req?.user?.is_admin;
    const userID = req?.user?.id;
    const { users, type, startDate, endDate, startTime, endTime } = req.query;

    const newQuery = {
        tenant_id: new mongoose.Types.ObjectId(req.user.tenant_id),
        type: 'output_produced',
    };

    // Filter by module type - now supports multiple types
    const parsedTypes = parseTypeFilter(type);
    if (parsedTypes) {
        if (parsedTypes.length === 1) {
            newQuery.module = parsedTypes[0];
        } else {
            newQuery.module = { $in: parsedTypes };
        }
    }

    // Apply user filter based on admin status
    if (isUserAdmin) {
        if (users && users !== "all") {
            newQuery.user_id = {
                $in: users.split(",").map((id) => new mongoose.Types.ObjectId(id)),
            };
        }
    } else {
        newQuery.user_id = new mongoose.Types.ObjectId(userID);
    }

    // Filter by date range (IST)
    if (startDate && endDate) {
        const startDateTime = moment.tz(
            `${startDate} ${startTime || "00:00:00"}`,
            "YYYY-MM-DD HH:mm:ss",
            "Asia/Kolkata"
        ).toDate();

        const endDateTime = moment.tz(
            `${endDate} ${endTime || "23:59:59"}`,
            "YYYY-MM-DD HH:mm:ss",
            "Asia/Kolkata"
        ).toDate();

        newQuery.$or = [
            { createdAt: { $gte: startDateTime, $lte: endDateTime } },
            { created_at: { $gte: startDateTime, $lte: endDateTime } },
        ];
    }

    const newData = await dashboardService.getOutputStatsNew(newQuery);
    const modifiedNewData = [
        { subCategories: newData }
    ];

    sendResponse(res, { data: modifiedNewData });
});


export const getCreditConsumption = asyncHandler(async (req, res) => {
    const isUserAdmin = req?.user?.is_admin;
    const userID = req?.user?.id;
    const { users, type, startDate, endDate, startTime, endTime } = req.query;

    const newQuery = {
        tenant_id: new mongoose.Types.ObjectId(req.user.tenant_id),
        type: 'credit_consumed'
    };

    // Filter by module type - now supports multiple types
    const parsedTypes = parseTypeFilter(type);
    if (parsedTypes) {
        if (parsedTypes.length === 1) {
            newQuery.module = parsedTypes[0];
        } else {
            newQuery.module = { $in: parsedTypes };
        }
    }

    // Apply user filter based on admin status
    if (isUserAdmin) {
        if (users && users !== "all") {
            newQuery.user_id = {
                $in: users.split(",").map((id) => new mongoose.Types.ObjectId(id)),
            };
        }
    } else {
        newQuery.user_id = new mongoose.Types.ObjectId(userID);
    }

    // Filter by date range (IST conversion)
    if (startDate && endDate) {
        const startDateTime = moment.tz(
            `${startDate} ${startTime || "00:00:00"}`,
            "YYYY-MM-DD HH:mm:ss",
            "Asia/Kolkata"
        ).toDate();

        const endDateTime = moment.tz(
            `${endDate} ${endTime || "23:59:59"}`,
            "YYYY-MM-DD HH:mm:ss",
            "Asia/Kolkata"
        ).toDate();

        newQuery.$or = [
            { createdAt: { $gte: startDateTime, $lte: endDateTime } },
            { created_at: { $gte: startDateTime, $lte: endDateTime } },
        ];
    }

    const newData = await dashboardService.getCreditConsumptionNew(newQuery);
    const modifiedNewData = [{ subCategories: newData }];

    sendResponse(res, { data: modifiedNewData });
});


export const getFreeOutputs = asyncHandler(async (req, res) => {
    const isUserAdmin = req?.user?.is_admin;
    const userID = req?.user?.id;
    const { users, type, startDate, endDate, startTime, endTime } = req.query;
    
    if (type === "non-ai") {
        return sendResponse(res, { data: [] });
    }
    
    const query = {};
    
    // Apply user filter based on admin status
    if (isUserAdmin) {
        // Admin can filter by requested users or see all
        if (users && users !== "all") {
            query.user_id = { $in: users.split(",") };
        }
    } else {
        // Non-admin can only see their own data
        query.user_id = userID;
    }
    
    // Filter by date range
    if (startDate && endDate) {
        const startDateTime = moment
            .tz(`${startDate} ${startTime || "00:00:00"}`, "YYYY-MM-DD HH:mm:ss", "Asia/Kolkata")
            .toDate();

        const endDateTime = moment
            .tz(`${endDate} ${endTime || "23:59:59"}`, "YYYY-MM-DD HH:mm:ss", "Asia/Kolkata")
            .toDate();

        query.$or = [
            { createdAt: { $gte: startDateTime, $lte: endDateTime } },
            { created_at: { $gte: startDateTime, $lte: endDateTime } },
        ];
    }

    
    const data = await dashboardService.getFreeOutputs(query);
    sendResponse(res, { data });
});

export const getActivityLog = asyncHandler(async (req, res) => {
    const isUserAdmin = req?.user?.is_admin || req?.user?.is_sub_admin;
    const userID = req?.user?.id;
    const { users, startDate, endDate, startTime, endTime } = req.query;
    
    const newQuery = {
        tenant_id: new mongoose.Types.ObjectId(req.user.tenant_id),
    };
    
    // Apply user filter based on admin status
    if (isUserAdmin) {
        if (users && users !== "all") {
            newQuery.user_id = {
                $in: users.split(",").map((id) => new mongoose.Types.ObjectId(id)),
            };
        }
    } else {
        newQuery.user_id = new mongoose.Types.ObjectId(userID);
    }
    
    // Filter by date range in IST
    if (startDate && endDate) {
        const startDateTime = moment.tz(
            `${startDate} ${startTime || "00:00:00"}`,
            "YYYY-MM-DD HH:mm:ss",
            "Asia/Kolkata"
        ).toDate();

        const endDateTime = moment.tz(
            `${endDate} ${endTime || "23:59:59"}`,
            "YYYY-MM-DD HH:mm:ss",
            "Asia/Kolkata"
        ).toDate();

        newQuery.$or = newQuery.$or
            ? newQuery.$or.concat([
                { createdAt: { $gte: startDateTime, $lte: endDateTime } },
                { created_at: { $gte: startDateTime, $lte: endDateTime } },
            ])
            : [
                { createdAt: { $gte: startDateTime, $lte: endDateTime } },
                { created_at: { $gte: startDateTime, $lte: endDateTime } },
            ];
    }
    
    const newData = await dashboardService.getActivityLogNew(newQuery);
    sendResponse(res, { data: newData });
});