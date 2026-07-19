import dotenv from "dotenv";
import { db } from "./db";

dotenv.config();

const normalizeOrigin = (value?: string) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/\/$/, "");
};

export const buildTrustedOrigins = (env: NodeJS.ProcessEnv = process.env) => {
  const origins = new Set<string>();

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

const serverOrigin =
  normalizeOrigin(process.env["NEXT_PUBLIC_BACKEND_URL"]) ||
  normalizeOrigin(process.env["NEXT_PUBLIC_API_URL"]) ||
  normalizeOrigin(process.env["BETTER_AUTH_URL"]) ||
  "http://localhost:8000";
const clientOrigin =
  normalizeOrigin(process.env["CLIENT_URL"]) ||
  normalizeOrigin(process.env["NEXT_PUBLIC_BETTER_AUTH_URL"]) ||
  normalizeOrigin(process.env["BETTER_AUTH_URL"]) ||
  "http://localhost:3000";
const trustedOrigins = buildTrustedOrigins({
  ...process.env,
  BETTER_AUTH_URL: serverOrigin,
  CLIENT_URL: clientOrigin,
});
const useSecureCookies =
  serverOrigin.startsWith("https://") || clientOrigin.startsWith("https://");
const isCrossSiteHttpsDeployment =
  serverOrigin.startsWith("https://") &&
  clientOrigin.startsWith("https://") &&
  serverOrigin !== clientOrigin;
const defaultCookieAttributes =
  isCrossSiteHttpsDeployment ?
    {
      sameSite: "none" as const,
      secure: true,
    }
  : {
      sameSite: "lax" as const,
      secure: useSecureCookies,
    };

let authInstance: any = null;

export const getAuth = async () => {
  if (authInstance) {
    return authInstance;
  }

  const hasMongoUri = Boolean(process.env["MONGODB_URI"]);

  if (!hasMongoUri) {
    console.warn(
      "MONGODB_URI is not configured; continuing without a database adapter.",
    );
  }

  const [{ betterAuth }, { mongodbAdapter }] = await Promise.all([
    import("better-auth"),
    import("better-auth/adapters/mongodb"),
  ]);

  const database = hasMongoUri && db ? mongodbAdapter(db) : undefined;

  authInstance = betterAuth({
    baseURL: serverOrigin,
    secret:
      process.env["BETTER_AUTH_SECRET"] || "pet-adoption-dev-secret-change-me",
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
