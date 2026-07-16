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

app.use(
  cors({
    origin:
      process.env["CLIENT_URL"] ||
      "https://pet-adoption-platform-drab.vercel.app",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

if (!process.env["VERCEL"]) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

const handler = serverless(app);

export { app, handler };
export default handler;
module.exports = handler;
