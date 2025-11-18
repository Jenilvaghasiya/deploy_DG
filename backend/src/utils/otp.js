export const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const isOtpExpired = (expiresAt) => {
    return new Date() > new Date(expiresAt);
};
