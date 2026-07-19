import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import serverless from "serverless-http";
import petRoutes from "./routes/petRoutes";
import { getMyPets } from "./controllers/petController";
import { requireAuth } from "./middleware/authMiddleware";

dotenv.config();

const app = express();
const port = Number(process.env["PORT"] || 8000);

const allowedOrigins = [
  process.env["CLIENT_URL"],
  process.env["BETTER_AUTH_URL"],
  "https://pet-adoption-platform-drab.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean) as string[];

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      origin.endsWith(".vercel.app/")
    ) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"],
};

app.use(cors(corsOptions as cors.CorsOptions));
app.options(
  /(.*)/,
  cors(corsOptions as cors.CorsOptions),
  (_req, res) => {
    res.sendStatus(204);
  },
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import { getAuth } from "./config/auth";

// Custom API routes
app.all("/api/auth/*splat", async (req, res) => {
  try {
    const auth = await getAuth();
    if (!auth) {
      res
        .status(500)
        .json({ error: "Auth not initialized. Check MONGODB_URI." });
      return;
    }

    const { toNodeHandler } = await import("better-auth/node");
    const handler = toNodeHandler(auth);
    await handler(req, res);
  } catch (error) {
    console.error("Better Auth Route Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error in Auth Route" });
    }
  }
});
app.use("/api/pets", petRoutes);
app.get("/api/my-pets", requireAuth, getMyPets);

// Basic health check route
app.get("/api/health", (_req, res) => {
  res
    .status(200)
    .json({ status: "OK", message: "Pet Adoption API is running" });
});

// Error handling middleware
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  },
);

if (!process.env["VERCEL"]) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

const handler = serverless(app);

export { app, handler };
export default handler;
