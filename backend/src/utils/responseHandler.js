const sendResponse = (
    res,
    { statusCode = 200, status = "success", data, message, meta },
) => {
    const response = {
        status,
        ...(data && { data }),
        ...(message && { message }),
        ...(meta && { meta }),
    };

    return res.status(statusCode).json(response);
};

export { sendResponse };
