import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env["MONGODB_URI"];

let client: MongoClient | undefined;
let clientPromise: Promise<MongoClient>;
let db: Db | undefined;

declare global {
  var _mongoClient: MongoClient | undefined;
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (uri) {
  if (process.env["NODE_ENV"] === "development") {
    // In development mode, keep a cached client and promise across module reloads.
    if (!global._mongoClientPromise || !global._mongoClient) {
      global._mongoClient = new MongoClient(uri);
      global._mongoClientPromise = global._mongoClient.connect();
    }

    client = global._mongoClient;
    clientPromise = global._mongoClientPromise;
  } else {
    // In production mode, create a fresh client.
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    clientPromise = client.connect();
    clientPromise.catch((err) => console.error("MongoDB connection error:", err.message));
  }

  db = client.db("pet_adoption");
} else {
  clientPromise = Promise.reject(
    new Error("MONGODB_URI is not configured. Set it to enable database routes."),
  );
  clientPromise.catch(() => {}); // prevent unhandled rejection crash
}

export default clientPromise;
export { db };
