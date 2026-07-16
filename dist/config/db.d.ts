import { MongoClient, Db } from "mongodb";
declare let clientPromise: Promise<MongoClient>;
declare let db: Db | undefined;
declare global {
    var _mongoClient: MongoClient | undefined;
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}
export default clientPromise;
export { db };
//# sourceMappingURL=db.d.ts.map