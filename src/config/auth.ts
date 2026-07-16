import dotenv from "dotenv";
import { db } from "./db";

dotenv.config();

const serverOrigin =
  process.env["BETTER_AUTH_URL"] ||
  "https://pet-adoption-platform-drab.vercel.app";
const clientOrigin =
  process.env["CLIENT_URL"] || "https://pet-adoption-platform-drab.vercel.app";

let authInstance: any = null;

export const getAuth = async () => {
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

  const database = db ? mongodbAdapter(db) : undefined;

  authInstance = betterAuth({
    baseURL: serverOrigin,
    secret:
      process.env["BETTER_AUTH_SECRET"] || "pet-adoption-dev-secret-change-me",
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
