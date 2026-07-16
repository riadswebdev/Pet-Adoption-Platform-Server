import express from "express";
import cors from "cors";
import dotenv from "dotenv";
const { toNodeHandler } = require("better-auth/node");
import { auth } from "./config/auth";
import petRoutes from "./routes/petRoutes";
import { getMyPets } from "./controllers/petController";
import { requireAuth } from "./middleware/authMiddleware";

dotenv.config();

const app = express();
const port = process.env["PORT"] || 8000;

app.use(
  cors({
    origin: process.env["CLIENT_URL"] || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Better Auth route
app.use("/api/auth", toNodeHandler(auth));

// Custom API routes
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
