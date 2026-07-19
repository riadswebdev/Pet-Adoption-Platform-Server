const assert = require("assert");
require("ts-node/register/transpile-only");

const { buildTrustedOrigins } = require("./src/config/auth");

const origins = buildTrustedOrigins({
  BETTER_AUTH_URL: "https://pet-adoption-server-eight.vercel.app",
  CLIENT_URL: "https://pet-adoption-platform-drab.vercel.app",
});

assert(origins.includes("https://pet-adoption-server-eight.vercel.app"));
assert(origins.includes("https://pet-adoption-platform-drab.vercel.app"));
assert(origins.includes("http://localhost:3000"));
assert(origins.includes("http://localhost:8000"));

console.log("Trusted origins check passed:", origins);
