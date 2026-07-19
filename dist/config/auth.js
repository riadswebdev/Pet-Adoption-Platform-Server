"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuth = exports.buildTrustedOrigins = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
dotenv_1.default.config();
const normalizeOrigin = (value) => {
    if (!value)
        return undefined;
    const trimmed = value.trim();
    if (!trimmed)
        return undefined;
    return trimmed.replace(/\/$/, "");
};
const buildTrustedOrigins = (env = process.env) => {
    const origins = new Set();
    for (const value of [
        env["BETTER_AUTH_URL"],
        env["CLIENT_URL"],
        env["NEXT_PUBLIC_BACKEND_URL"],
        env["NEXT_PUBLIC_API_URL"],
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]) {
        const normalized = normalizeOrigin(value);
        if (normalized) {
            origins.add(normalized);
        }
    }
    return Array.from(origins);
};
exports.buildTrustedOrigins = buildTrustedOrigins;
const serverOrigin = normalizeOrigin(process.env["NEXT_PUBLIC_BACKEND_URL"]) ||
    normalizeOrigin(process.env["NEXT_PUBLIC_API_URL"]) ||
    normalizeOrigin(process.env["BETTER_AUTH_URL"]) ||
    "http://localhost:8000";
const clientOrigin = normalizeOrigin(process.env["CLIENT_URL"]) ||
    normalizeOrigin(process.env["NEXT_PUBLIC_BETTER_AUTH_URL"]) ||
    normalizeOrigin(process.env["BETTER_AUTH_URL"]) ||
    "http://localhost:3000";
const trustedOrigins = (0, exports.buildTrustedOrigins)({
    ...process.env,
    BETTER_AUTH_URL: serverOrigin,
    CLIENT_URL: clientOrigin,
});
const useSecureCookies = serverOrigin.startsWith("https://") || clientOrigin.startsWith("https://");
const isCrossSiteHttpsDeployment = serverOrigin.startsWith("https://") &&
    clientOrigin.startsWith("https://") &&
    serverOrigin !== clientOrigin;
const defaultCookieAttributes = isCrossSiteHttpsDeployment ?
    {
        sameSite: "none",
        secure: true,
    }
    : {
        sameSite: "lax",
        secure: useSecureCookies,
    };
let authInstance = null;
const getAuth = async () => {
    if (authInstance) {
        return authInstance;
    }
    const hasMongoUri = Boolean(process.env["MONGODB_URI"]);
    if (!hasMongoUri) {
        console.warn("MONGODB_URI is not configured; continuing without a database adapter.");
    }
    const [{ betterAuth }, { mongodbAdapter }] = await Promise.all([
        import("better-auth"),
        import("better-auth/adapters/mongodb"),
    ]);
    const database = hasMongoUri && db_1.db ? mongodbAdapter(db_1.db) : undefined;
    authInstance = betterAuth({
        baseURL: serverOrigin,
        secret: process.env["BETTER_AUTH_SECRET"] || "pet-adoption-dev-secret-change-me",
        trustedOrigins,
        advanced: {
            useSecureCookies,
            defaultCookieAttributes,
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