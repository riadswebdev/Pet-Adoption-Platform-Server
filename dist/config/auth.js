"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuth = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
dotenv_1.default.config();
const serverOrigin = process.env["BETTER_AUTH_URL"] ||
    "https://pet-adoption-platform-drab.vercel.app";
const clientOrigin = process.env["CLIENT_URL"] || "https://pet-adoption-platform-drab.vercel.app";
let authInstance = null;
const getAuth = async () => {
    if (authInstance) {
        return authInstance;
    }
    if (!process.env["MONGODB_URI"]) {
        return null;
    }
    const [{ betterAuth }, { mongodbAdapter }] = await Promise.all([
        import("better-auth"),
        import("better-auth/adapters/mongodb"),
    ]);
    const database = db_1.db ? mongodbAdapter(db_1.db) : undefined;
    authInstance = betterAuth({
        baseURL: serverOrigin,
        secret: process.env["BETTER_AUTH_SECRET"] || "pet-adoption-dev-secret-change-me",
        trustedOrigins: [serverOrigin, clientOrigin],
        advanced: {
            useSecureCookies: false,
        },
        ...(database ? { database } : {}),
        session: {
            cookieCache: {
                enabled: false,
            },
        },
        emailAndPassword: {
            enabled: true,
        },
        user: {
            additionalFields: {
                phone: { type: "string", required: false },
                address: { type: "string", required: false },
                avatar: { type: "string", required: false },
                role: { type: "string", required: false, defaultValue: "user" },
                bio: { type: "string", required: false },
            },
        },
    });
    return authInstance;
};
exports.getAuth = getAuth;
//# sourceMappingURL=auth.js.map