import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env["MONGODB_URI"];

if (!uri) {
  throw new Error("Please add your Mongo URI to .env");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClient: MongoClient | undefined;
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

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
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

const db: Db = client.db("pet_adoption");

export default clientPromise;
export { db };
