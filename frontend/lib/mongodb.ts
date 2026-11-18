import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise2424: Promise<MongoClient> | undefined;
}

const mongoUri = process.env.MONGODB_URI?.trim();
const mongoDbName = process.env.MONGODB_DB_NAME?.trim() || "2424";

export function isMongoConfigured() {
  return Boolean(mongoUri);
}

export function getMongoDbName() {
  return mongoDbName;
}

export async function getMongoClient(): Promise<MongoClient> {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (!global.__mongoClientPromise2424) {
    const client = new MongoClient(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 0,
      retryWrites: true,
      appName: "2424-frontend",
    });
    global.__mongoClientPromise2424 = client.connect();
  }

  return global.__mongoClientPromise2424;
}
