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

const samplePets = [
  {
    _id: "pet-1",
    petName: "Milo",
    category: "Dog",
    breed: "Labrador",
    age: "2 years",
    gender: "Male",
    location: "Colombo",
    description: "Friendly and playful companion.",
    images: [
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=800",
    ],
    adoptionStatus: "Available",
    vaccinated: true,
    neutered: true,
    isFeatured: true,
  },
  {
    _id: "pet-2",
    petName: "Luna",
    category: "Cat",
    breed: "Persian",
    age: "1 year",
    gender: "Female",
    location: "Kandy",
    description: "Gentle and affectionate cat.",
    images: [
      "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&q=80&w=800",
    ],
    adoptionStatus: "Available",
    vaccinated: true,
    neutered: true,
    isFeatured: true,
  },
];

app.get("/api/pets", (_req, res) => {
  res.status(200).json(samplePets);
});

app.get("/api/pets/:id", (req, res) => {
  const pet = samplePets.find((item) => item._id === req.params.id);

  if (!pet) {
    res.status(404).json({ error: "Pet not found" });
    return;
  }

  res.status(200).json(pet);
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
