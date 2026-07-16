import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import { PetInput } from "../models/Pet";

const createMockPet = (
  pet: Omit<PetInput, "createdAt" | "updatedAt">,
): PetInput => ({
  ...pet,
  createdAt: new Date(),
  updatedAt: new Date(),
});

dotenv.config();

const uri = process.env["MONGODB_URI"];

if (!uri) {
  throw new Error("Please add your Mongo URI to .env");
}

const mockPets: PetInput[] = [
  createMockPet({
    title: "Friendly Golden Retriever",
    slug: "friendly-golden-retriever",
    petName: "Buddy",
    category: "Dog",
    breed: "Golden Retriever",
    age: "2 years",
    gender: "Male",
    weight: "30 kg",
    color: "Golden",
    vaccinated: true,
    neutered: true,
    healthCondition: "Healthy",
    adoptionFee: 150,
    location: "New York, NY",
    images: [
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1000",
    ],
    shortDescription: "A very friendly and energetic dog.",
    description:
      "Buddy is a purebred Golden Retriever who loves to play fetch and go for long walks. He is great with kids and other pets.",
    isFeatured: true,
    adoptionStatus: "Available",
    userId: new ObjectId().toHexString(),
    userName: "John Doe",
    userEmail: "john@example.com",
    userPhoto: "",
  }),
  createMockPet({
    title: "Cute Tabby Kitten",
    slug: "cute-tabby-kitten",
    petName: "Luna",
    category: "Cat",
    breed: "Tabby",
    age: "3 months",
    gender: "Female",
    weight: "2 kg",
    color: "Grey/Black",
    vaccinated: false,
    neutered: false,
    healthCondition: "Healthy, needs next round of shots",
    adoptionFee: 50,
    location: "Los Angeles, CA",
    images: [
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=1000",
    ],
    shortDescription: "Playful kitten looking for a loving home.",
    description:
      "Luna was rescued from the streets and is now looking for a forever home. She is very playful and loves string toys.",
    isFeatured: false,
    adoptionStatus: "Available",
    userId: new ObjectId().toHexString(),
    userName: "Jane Smith",
    userEmail: "jane@example.com",
    userPhoto: "",
  }),
];

async function seed() {
  const client = new MongoClient(uri as string);
  try {
    await client.connect();
    console.log("Connected to database");

    const db = client.db();
    const petsCollection = db.collection("pets");

    // Optional: clear existing data
    // await petsCollection.deleteMany({});

    const petsToInsert = mockPets.map((pet) => ({
      ...pet,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await petsCollection.insertMany(petsToInsert);
    console.log(`Seeded ${petsToInsert.length} pets successfully`);
  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    await client.close();
  }
}

seed();
