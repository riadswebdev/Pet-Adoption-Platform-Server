"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const uri = process.env["MONGODB_URI"];
let client;
let clientPromise;
let db;
if (uri) {
    if (process.env["NODE_ENV"] === "development") {
        if (!global._mongoClientPromise || !global._mongoClient) {
            global._mongoClient = new mongodb_1.MongoClient(uri);
            global._mongoClientPromise = global._mongoClient.connect();
        }
        client = global._mongoClient;
        clientPromise = global._mongoClientPromise;
    }
    else {
        client = new mongodb_1.MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
        clientPromise = client.connect();
        clientPromise.catch((err) => console.error("MongoDB connection error:", err.message));
    }
    exports.db = db = client.db("pet_adoption");
}
else {
    clientPromise = Promise.reject(new Error("MONGODB_URI is not configured. Set it to enable database routes."));
    clientPromise.catch(() => { });
}
exports.default = clientPromise;
//# sourceMappingURL=db.js.map