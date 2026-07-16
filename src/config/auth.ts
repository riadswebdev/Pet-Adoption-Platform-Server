import dotenv from "dotenv";
const { betterAuth } = require("better-auth");
const { mongodbAdapter } = require("better-auth/adapters/mongodb");
import { db } from "./db";

dotenv.config();

const serverOrigin = process.env["BETTER_AUTH_URL"] || "http://localhost:8000";
const clientOrigin = process.env["CLIENT_URL"] || "http://localhost:3000";

export const auth = betterAuth({
  baseURL: serverOrigin,
  secret:
    process.env["BETTER_AUTH_SECRET"] || "pet-adoption-dev-secret-change-me",
  trustedOrigins: [serverOrigin, clientOrigin],
  advanced: {
    useSecureCookies: false,
  },
  database: mongodbAdapter(db),
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
