import { configDotenv } from "dotenv";
configDotenv();

export const config = {
    apiPrefix: process.env.API_PREFIX || "/api/v1",

    clientBaseUrl: process.env.CLIENT_BASE_URL || "http://localhost:5173",

    env: process.env.NODE_ENV || "development",
    port: process.env.PORT || 3000,

    mongo: {
        uri: process.env.MONGO_URI || "mongodb://localhost:27017/design_genie",
    },

    jwt: {
        secret: process.env.JWT_SECRET || "d5e5979323bbdb5d258027afbeddaa963d603f163214e402429b6279275a5e8e54b6e1231fda04d9c0c8113cc0ec89ecfa2c8fea1170a4d1c44b44145e089493",
        expiresIn: process.env.TOKEN_EXPIRE || "24h",
        longExpiry: process.env.KEEP_LOGIN_EXPIRE || "30d"    
    },

    cors: {
        // origin: process.env.ALLOWED_ORIGINS?.split(",") || [
        //     "http://localhost:3000",
        //     "http://localhost:5173",
        // ],
        origin: '*',
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        credentials: true,
        maxAge: 86400, // 24 hours
    },

    mail: {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT) || 465,
        // If SMTP_SECURE is not explicitly set, default to true for port 465
        secure: process.env.SMTP_SECURE
            ? process.env.SMTP_SECURE === "true"
            : (parseInt(process.env.SMTP_PORT) || 465) === 465,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
      startupCredits: 100,
};
