const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8000);
const host = process.env.HOST || "0.0.0.0";

app.use(
  cors({
    origin:
      process.env.CLIENT_URL || "https://pet-adoption-platform-drab.vercel.app",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get(["/", "/health"], (_req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Pet Adoption API is running",
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Pet Adoption API is running",
  });
});

app.get("/api/pets", (_req, res) => {
  res.status(200).json({
    message: "Pet listing endpoint is ready",
    note: "Render deployment is running",
  });
});

app.get(["/favicon.ico", "/favicon.png"], (_req, res) => {
  res.status(204).end();
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

if (require.main === module) {
  app.listen(port, host, () => {
    console.log(`Server listening on http://${host}:${port}`);
  });
}

module.exports = app;
